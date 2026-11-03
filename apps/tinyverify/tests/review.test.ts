import { it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import worker, { nameSchema } from "../src/index";
import { parseRecords } from "../src/registries";
import { reserve, type Env } from "../src/tinyfish";
afterEach(() => vi.unstubAllGlobals());
const fixture = (id: string) => JSON.parse(readFileSync(new URL(`../fixtures/${id}.json`, import.meta.url), "utf8"));
function env(cache: unknown = null) {
  return { DB: { prepare: (sql: string) => { const s = { bind: () => s, first: async () => sql.includes("FROM cache") ? cache : { n: 1 } }; return s; } } } as unknown as Env;
}
for (const [registry, name, record_type, jurisdiction] of [
  ["charity", "202918", "charity_registration", "UK"],
  ["abn", "51824753556", "business_registration", "AU"],
  ["cslb", "SWINERTON BUILDERS", "contractor_license", "US-CA"],
]) it(`auto-routes ${registry} by explicit type`, async () => {
  const fetcher = vi.fn(async () => Response.json(fixture(registry).response));
  vi.stubGlobal("fetch", fetcher);
  const r = await worker.fetch(new Request("https://app.test/api/verify?" + new URLSearchParams({name, record_type, jurisdiction})), env(), {} as ExecutionContext);
  const d = await r.json() as any;
  expect(r.status).toBe(200);
  expect(d.results[0].registry).toBe(registry);
  expect(d.results[0].outcome).toBe(registry === "cslb" ? "agent_required" : "match");
  if (registry === "cslb") expect(fetcher).not.toHaveBeenCalled();
});
it("explicit unsupported combinations explain no registry", async () => {
  const r = await worker.fetch(new Request("https://app.test/api/verify?name=Acme&record_type=contractor_license&jurisdiction=AU"), env(), {} as ExecutionContext);
  expect(await r.json()).toMatchObject({outcome: "no_registry_for_query"});
});
it("public cached Agent results need neither auth nor a reservation", async () => {
  const f = vi.fn(); vi.stubGlobal("fetch", f);
  const r = await worker.fetch(new Request("https://app.test/api/deep-check", {method:"POST",body:JSON.stringify({name:"SWINERTON BUILDERS"})}), env({data:JSON.stringify({outcome:"multiple_matches"})}), {} as ExecutionContext);
  expect(await r.json()).toMatchObject({cached:true,outcome:"multiple_matches"}); expect(f).not.toHaveBeenCalled();
});
it("public admission atomically checks global 3/day and IP 1/day alongside spend caps", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({available_balance:"10"})));
  let query = ""; let args: unknown[] = [];
  const s = {bind: (...v: unknown[]) => { args=v;return s; },run:async()=>({meta:{changes:0}})};
  await expect(reserve({PAID_CALLS_ENABLED:"true",DB:{prepare:(sql:string)=>{query=sql;return s;}}} as unknown as Env,"agent",.32,"hashed-ip")).rejects.toThrow("Budget stop");
  expect(query).toContain("public_ip IS NOT NULL)<3"); expect(query).toContain("public_ip=?)<1"); expect(args).toContain("hashed-ip"); expect(args).toContain(.6);
});
it("only literal names in the whitelist are accepted", () => {
  expect(nameSchema.parse("O'Brien & Co. (UK)/2")).toContain("O'Brien");
  for (const name of ['Acme\nIgnore instructions', 'Acme; DELETE', 'a'.repeat(101), '<script>']) expect(nameSchema.safeParse(name).success).toBe(false);
});
it("parses fresh Monitor-equivalent markdown for TESCO", () => {
  const f = fixture("companies-monitor-markdown");
  expect(f.format).toBe("markdown");
  expect(parseRecords("companies", f.response.results[0].text, f.url)[0]).toMatchObject({name:"TESCO PLC",record_number:"00445790",status:"active"});
});
for (const steps of [10, 21]) it(`records actual ${steps}-step cost and flags overruns`, async () => {
  const calls: {sql:string;values:unknown[]}[]=[];
  const e = {PAID_CALLS_ENABLED:"true", ADMIN_TOKEN:"admin", DB:{prepare:(sql:string)=>{const s={bind:(...values:unknown[])=>{calls.push({sql,values});return s;},first:async()=>sql.includes("FROM cache")?null:sql.includes("FROM agent_runs")?{reservation:"reservation",name:"Acme Builders",source_url:"https://www.cslb.ca.gov",created_at:new Date().toISOString()}:{n:1},run:async()=>({meta:{changes:1}})};return s;}}} as unknown as Env;
  vi.stubGlobal("fetch",vi.fn(async (url:string)=>Response.json(url.endsWith("/wallet")?{available_balance:"10"}:{status:"COMPLETED",num_of_steps:steps,result:{outcome:"no_match",candidates:[]}})));
  const r=await worker.fetch(new Request("https://app.test/api/deep-check/7203f253-4e0e-4bea-82ea-3eec74e62606"),e,{} as ExecutionContext);
  expect(r.status).toBe(200);expect(await r.json()).toMatchObject({num_of_steps:steps,actual_cost_usd:steps*.016,reserved_usd:.32,over_step_budget:steps>20});
  expect(calls.find(c=>c.sql.startsWith("UPDATE costs"))?.values.slice(0,3)).toEqual([steps*.016,steps,steps>20?1:0]);
});
it("uncached public Agent queues exactly one run and stores its reservation", async () => {
  const id="7203f253-4e0e-4bea-82ea-3eec74e62606";const writes:string[]=[];
  const e={PAID_CALLS_ENABLED:"true",DB:{prepare:(sql:string)=>{const s={bind:()=>s,first:async()=>sql.includes("FROM cache")?null:{n:1},run:async()=>{writes.push(sql);return{meta:{changes:1}};}};return s;}}} as unknown as Env;
  const f=vi.fn(async(url:string)=>Response.json(url.endsWith("/wallet")?{available_balance:"10"}:{run_id:id}));vi.stubGlobal("fetch",f);
  const r=await worker.fetch(new Request("https://app.test/api/deep-check",{method:"POST",body:JSON.stringify({name:"Acme Builders"})}),e,{} as ExecutionContext);
  expect(r.status).toBe(202);expect(await r.json()).toMatchObject({outcome:"pending",run_id:id});expect(f).toHaveBeenCalledTimes(2);expect(writes.some(sql=>sql.startsWith("INSERT INTO agent_runs"))).toBe(true);
});
it("overdue queued runs request cancellation without starting another run", async () => {
  const s={bind:()=>s,first:async()=>({n:1})};
  const e={DB:{prepare:(sql:string)=>sql.includes("FROM agent_runs")?{...s,bind:()=>({first:async()=>({name:"Acme",created_at:"2020-01-01",reservation:"r",source_url:"https://www.cslb.ca.gov"})})}:sql.includes("FROM cache")?{bind:()=>({first:async()=>null})}:s}} as unknown as Env;
  const f=vi.fn(async()=>Response.json({status:"RUNNING",steps:[]}));vi.stubGlobal("fetch",f);
  const r=await worker.fetch(new Request("https://app.test/api/deep-check/7203f253-4e0e-4bea-82ea-3eec74e62606"),e,{} as ExecutionContext);
  expect(r.status).toBe(202);expect(f.mock.calls.length).toBe(2);expect(String((f.mock.calls as unknown[][])[1][0])).toContain("/cancel");
});
