import { readFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { filmOutput } from "../src/schema.js";
const key = readFileSync(".dev.vars", "utf8").match(
  /^TINYFISH_API_KEY=(.+)/m,
)?.[1];
if (!key) throw Error("Local ignored .dev.vars required for standalone smoke");
const c = new Client({ name: "standalone-smoke", version: "1.0.0" });
const env = Object.fromEntries(
  Object.entries(process.env).filter(
    (e): e is [string, string] => typeof e[1] === "string",
  ),
);
env.TINYFISH_API_KEY = key;
env.PAID_CALLS_ENABLED = "false";
try {
  await c.connect(
    new StdioClientTransport({
      command: "npx",
      args: ["--prefix", ".", "site-to-mcp"],
      env,
    }),
  );
  console.log(
    "stdio tools",
    (await c.listTools()).tools.map((t) => t.name),
  );
  const r = await c.callTool(
    { name: "get_film", arguments: { film_id: "1808" } },
    undefined,
    { timeout: 180000 },
  );
  console.log(JSON.stringify(filmOutput.parse(r.structuredContent), null, 2));
} finally {
  await c.close();
}
