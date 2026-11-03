import { writeFile } from "node:fs/promises";
const base = "https://tinyverify.sundaysebasidian.workers.dev";
let r = await fetch(base + (process.env.RESUME_RUN_ID ? `/api/deep-check/${process.env.RESUME_RUN_ID}` : "/api/deep-check"), process.env.RESUME_RUN_ID ? undefined : {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ name: "SWINERTON BUILDERS" }),
});
let data = await r.json();
while (data.outcome === "pending") {
  await new Promise(resolve => setTimeout(resolve, 5000));
  r = await fetch(base + `/api/deep-check/${data.run_id}`);
  data = await r.json();
}
console.log(r.status, JSON.stringify(data).slice(0, 1000));
await writeFile(
  "agent-evidence.json",
  JSON.stringify(
    { at: new Date().toISOString(), status: r.status, data },
    null,
    2,
  ),
);
const costs = await fetch(base + "/api/admin/costs", {
  headers: { Authorization: `Bearer ${process.env.ADMIN_TOKEN}` },
}).then((r) => r.json());
await writeFile(
  ".cost-log.jsonl",
  costs.results.map((x) => JSON.stringify(x)).join("\n") + "\n",
);
