import { writeFile, appendFile } from "node:fs/promises";
const base = "https://tinyverify.sundaysebasidian.workers.dev";
const r = await fetch(base + "/api/deep-check", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ name: "Turner Construction Company" }),
});
const data = await r.json();
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
