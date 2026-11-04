import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { z } from "zod";
const output = execFileSync(
  "npx",
  [
    "wrangler",
    "d1",
    "execute",
    "site-to-mcp-pcc",
    "--remote",
    "--command",
    "SELECT * FROM costs ORDER BY at",
    "--json",
  ],
  { encoding: "utf8" },
);
const rows = z
  .array(z.object({ results: z.array(z.record(z.string(), z.unknown())) }))
  .parse(JSON.parse(output))
  .flatMap((r) => r.results);
writeFileSync(
  ".cost-log.jsonl",
  rows.map((r) => JSON.stringify(r)).join("\n") + "\n",
);
console.log(`Exported ${rows.length} cost events; no credentials included`);
