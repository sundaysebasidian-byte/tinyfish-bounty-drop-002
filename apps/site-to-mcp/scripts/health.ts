import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { healthOutput } from "../src/schema.js";
const client = new Client({ name: "pcc-health", version: "1.0.0" });
try {
  await client.connect(
    new StreamableHTTPClientTransport(
      new URL(
        process.env.SITE_TO_MCP_URL ??
          "https://site-to-mcp-pcc.sundaysebasidian.workers.dev/mcp",
      ),
    ),
  );
  const r = await client.callTool(
    { name: "health_check", arguments: {} },
    undefined,
    { timeout: 600000 },
  );
  const report = healthOutput.parse(r.structuredContent);
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
} finally {
  await client.close();
}
