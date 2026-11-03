import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
const c = new Client({ name: "pcc-smoke", version: "1.0.0" });
await c.connect(
  new StreamableHTTPClientTransport(
    new URL(
      process.env.SITE_TO_MCP_URL ??
        "https://site-to-mcp-pcc.sundaysebasidian.workers.dev/mcp",
    ),
  ),
);
try {
  console.log(
    "Tools:",
    (await c.listTools()).tools.map((t) => t.name),
  );
  for (const [name, args] of [
    ["search_films", { query: "Akira" }],
    ["get_film", { film_id: "1808" }],
    ["get_screenings", { film_id: "1808" }],
    ["search_films", { query: "2001" }],
    ["get_film", { film_id: "7260457" }],
  ] as const) {
    const r = await c.callTool({ name, arguments: args });
    console.log(name, JSON.stringify(r));
    if (r.isError) throw Error("Tool failed");
  }
} finally {
  await c.close();
}
