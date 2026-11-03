import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Runtime } from "./runtime.js";
import { LocalState } from "./local-state.js";
import { createServer } from "./server.js";
import { z } from "zod";
import { ToolError } from "./schema.js";
if (process.env.TINYFISH_API_KEY) {
  const server = createServer(
    new Runtime({
      DB: new LocalState(
        process.env.SITE_TO_MCP_STATE ?? ".local-state.sqlite",
      ),
      TINYFISH_API_KEY: process.env.TINYFISH_API_KEY,
      PAID_CALLS_ENABLED: process.env.PAID_CALLS_ENABLED ?? "false",
    }),
  );
  await server.connect(new StdioServerTransport());
} else {
  const endpoint =
    process.env.SITE_TO_MCP_URL ??
    "https://site-to-mcp-pcc.sundaysebasidian.workers.dev/mcp";
  const remote = new Client({ name: "pcc-stdio-bridge", version: "1.0.0" });
  await remote.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
  const server = createServer({
    async run(name, input) {
      const result = await remote.callTool({
        name,
        arguments: input as Record<string, unknown>,
      });
      if (result.isError) {
        const error = z
          .object({
            error: z.object({ code: z.string(), message: z.string() }),
          })
          .safeParse(result.structuredContent);
        throw new ToolError(
          error.success ? error.data.error.code : "REMOTE_TOOL_FAILED",
          error.success ? error.data.error.message : "Hosted tool failed",
        );
      }
      if (!result.structuredContent)
        throw new ToolError("SITE_CHANGED", "Missing structured tool output");
      return z.record(z.string(), z.unknown()).parse(result.structuredContent);
    },
  });
  await server.connect(new StdioServerTransport());
  for (const signal of ["SIGINT", "SIGTERM"] as const)
    process.on(signal, () => {
      void Promise.all([server.close(), remote.close()]).then(() =>
        process.exit(0),
      );
    });
}
