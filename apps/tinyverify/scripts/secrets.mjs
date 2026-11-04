import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
const secrets = {
  TINYFISH_API_KEY: process.env.TINYFISH_API_KEY,
  ADMIN_TOKEN: randomBytes(32).toString("hex"),
};
if (!secrets.TINYFISH_API_KEY) throw Error("Missing key");
writeFileSync(
  ".dev.vars",
  Object.entries(secrets)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n"),
  { mode: 0o600 },
);
for (const [name, value] of Object.entries(secrets)) {
  const r = spawnSync("npx", ["wrangler", "secret", "put", name], {
    input: value,
    encoding: "utf8",
  });
  console.log(name, r.status === 0 ? "installed" : "FAILED");
  if (r.status !== 0) process.exit(1);
}
