import { it, expect, vi, afterEach } from "vitest";
import worker from "../src/index";
import { reserve, type Env } from "../src/tinyfish";
afterEach(() => vi.unstubAllGlobals());
it("disabled paid guard makes no external call", async () => {
  const f = vi.fn();
  vi.stubGlobal("fetch", f);
  await expect(
    reserve({ PAID_CALLS_ENABLED: "false" } as Env, "agent", 0.32),
  ).rejects.toThrow("disabled");
  expect(f).not.toHaveBeenCalled();
});
it("wallet floor prevents any D1 reservation", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ available_balance: "3.10" })),
  );
  const prepare = vi.fn();
  await expect(
    reserve(
      { PAID_CALLS_ENABLED: "true", DB: { prepare } } as unknown as Env,
      "agent",
      0.32,
    ),
  ).rejects.toThrow("Wallet floor");
  expect(prepare).not.toHaveBeenCalled();
});
it("atomic budget refusal blocks a paid call", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ available_balance: "10" })),
  );
  const statement = {
    bind: () => statement,
    run: async () => ({ meta: { changes: 0 } }),
  };
  await expect(
    reserve(
      {
        PAID_CALLS_ENABLED: "true",
        DB: { prepare: () => statement },
      } as unknown as Env,
      "agent",
      0.32,
    ),
  ).rejects.toThrow("Budget stop");
});
function env() {
  const statement = { bind: () => statement, first: async () => ({ n: 1 }) };
  return {
    DB: { prepare: () => statement },
    ADMIN_TOKEN: "test-admin",
  } as unknown as Env;
}
it("public callers cannot create paid monitors", async () => {
  for (const path of ["/api/watches"]) {
    const r = await worker.fetch(
      new Request("https://app.test" + path, { method: "POST", body: "{}" }),
      env(),
      {} as ExecutionContext,
    );
    expect(r.status).toBe(401);
  }
});
it("cross-origin paid writes are refused", async () => {
  const r = await worker.fetch(
    new Request("https://app.test/api/watches", {
      method: "POST",
      headers: { origin: "https://evil.test" },
      body: "{}",
    }),
    env(),
    {} as ExecutionContext,
  );
  expect(r.status).toBe(403);
});
it("name, type and jurisdiction are mandatory", async () => {
  const r = await worker.fetch(
    new Request("https://app.test/api/verify?name=Acme"),
    env(),
    {} as ExecutionContext,
  );
  expect(r.status).toBe(400);
});
it("bad webhook token cannot alter records", async () => {
  const statement = { bind: () => statement, first: async () => null };
  const e = { DB: { prepare: () => statement } } as unknown as Env;
  const r = await worker.fetch(
    new Request("https://app.test/api/webhooks/monitor/unknown/invalid", {
      method: "POST",
      body: "{}",
    }),
    e,
    {} as ExecutionContext,
  );
  expect(r.status).toBe(401);
});
import { readFileSync } from "node:fs";
import { parseRecords } from "../src/registries";
for (const mode of ["unchanged", "duplicate", "source_error"])
  it(`Monitor webhook ${mode}`, async () => {
    const f = JSON.parse(
      readFileSync(
        new URL("../fixtures/companies-monitor-markdown.json", import.meta.url),
        "utf8",
      ),
    );
    const record = parseRecords(
      "companies",
      f.response.results[0].text,
      f.url,
    )[0];
    const receipt = {
      id: "receipt",
      registry: "companies",
      record,
      source_url: f.url,
    };
    let saved = "";
    const batch = vi.fn(async (statements: unknown[]) => statements);
    const e = {
      DB: {
        prepare: (sql: string) => {
          const statement = {
            bind: (...values: unknown[]) => {
              if (sql.startsWith("INSERT") && sql.includes("events"))
                saved = String(values[2]);
              return statement;
            },
            first: async () =>
              sql.includes("FROM watches")
                ? {
                    id: "watch",
                    receipt_id: "receipt",
                    monitor_id: "monitor",
                    current_data: null,
                  }
                : sql.includes("FROM receipts")
                  ? { data: JSON.stringify(receipt) }
                  : mode === "duplicate"
                    ? { id: "event" }
                    : null,
            run: async () => ({ meta: { changes: 1 } }),
          };
          return statement;
        },
        batch,
      },
    } as unknown as Env;
    const body = {
      id: "event",
      fetch_monitor_id: "monitor",
      results:
        mode === "source_error"
          ? []
          : [{ url: f.url, text: f.response.results[0].text }],
      errors: mode === "source_error" ? ["timeout"] : [],
    };
    const r = await worker.fetch(
      new Request("https://app.test/api/webhooks/monitor/watch/token", {
        method: "POST",
        headers: { "Content-Type": "application/json", origin: "https://monitor.tinyfish.ai" },
        body: JSON.stringify(body),
      }),
      e,
      {} as ExecutionContext,
    );
    expect(r.status).toBe(200);
    if (mode === "duplicate") {
      expect(await r.json()).toEqual({ duplicate: true });
      expect(batch).not.toHaveBeenCalled();
    } else if (mode === "source_error") {
      expect(JSON.parse(saved).outcome).toBe("registry_error");
      expect(batch).not.toHaveBeenCalled();
    } else {
      expect(JSON.parse(saved).status_changed).toBe(false);
      expect(batch).toHaveBeenCalledOnce();
    }
  });
it('receipt and directory permalinks serve the app without canonical redirects',async()=>{for(const path of ['/r/a-receipt','/registries']){const e={ASSETS:{fetch:async(req:Request)=>new URL(req.url).pathname==='/'?new Response('<html>app</html>',{headers:{'Content-Type':'text/html'}}):Response.redirect('https://app.test/',307)}} as unknown as Env;const r=await worker.fetch(new Request('https://app.test'+path),e,{} as ExecutionContext);expect(r.status).toBe(200);expect(await r.text()).toContain('app');}});
