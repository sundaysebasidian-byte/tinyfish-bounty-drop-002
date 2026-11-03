import fs from "node:fs";
import { spawnSync } from "node:child_process";
const path = process.argv[2];
if (!path) throw Error("Pass the path to the existing .env.local");
const key = fs
  .readFileSync(path, "utf8")
  .match(/^TINYFISH_API_KEY=["']?([^\r\n"']+)/m)?.[1];
if (!key) throw Error("Key missing");
const r = spawnSync("npx", ["wrangler", "secret", "put", "TINYFISH_API_KEY"], {
  input: key,
  encoding: "utf8",
});
console.log(r.stdout);
console.error(r.stderr);
process.exit(r.status ?? 1);
