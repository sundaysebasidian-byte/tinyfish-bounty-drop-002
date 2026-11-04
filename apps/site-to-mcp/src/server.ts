import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { definitions, Runtime, type ToolName } from "./runtime.js";
import { fault } from "./schema.js";
export function createServer(runtime: Pick<Runtime, "run">) {
  const server = new McpServer({
    name: "prince-charles-cinema",
    version: "1.0.0",
  });
  for (const name of Object.keys(definitions) as ToolName[]) {
    const def = definitions[name];
    server.registerTool(
      name,
      {
        description: def.description,
        inputSchema: def.input,
        outputSchema: def.output,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
      },
      async (input: unknown) => {
        try {
          const result = await runtime.run(name, input);
          return {
            content: [{ type: "text" as const, text: JSON.stringify(result) }],
            structuredContent: result,
            ...(name === "health_check" && result.ok === false
              ? { isError: true }
              : {}),
          };
        } catch (e) {
          const error = fault(e);
          return {
            isError: true,
            content: [
              { type: "text" as const, text: JSON.stringify({ error }) },
            ],
            structuredContent: { error },
          };
        }
      },
    );
  }
  return server;
}
