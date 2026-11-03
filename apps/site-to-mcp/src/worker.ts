import { Hono } from "hono";
import { StreamableHTTPTransport } from "@hono/mcp";
import { Runtime } from "./runtime.js";
import { createServer } from "./server.js";
import { landing, css } from "./landing.js";
const app = new Hono<{ Bindings: Env }>();
app.use("*", async (c, next) => {
  const origin = c.req.header("Origin");
  if (origin && origin !== new URL(c.req.url).origin)
    return c.json({ error: "FORBIDDEN_ORIGIN" }, 403);
  const ip = c.req.header("CF-Connecting-IP") ?? "local",
    bucket = Math.floor(Date.now() / 60000);
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(ip),
  );
  const key = `${bucket}:${Array.from(new Uint8Array(hash))
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;
  const n = await c.env.DB.prepare(
    "INSERT INTO limits VALUES(?,1) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count",
  )
    .bind(key)
    .first<{ count: number }>();
  if (!n || n.count > 60) return c.json({ error: "RATE_LIMIT" }, 429);
  await next();
});
app.get("/", (c) => c.html(landing(new URL(c.req.url).origin)));
app.get("/style.css", (c) => c.body(css, 200, { "Content-Type": "text/css" }));
app.get("/health", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT value FROM cache WHERE key='last-health'",
  ).first<{ value: string }>();
  return row
    ? c.json(JSON.parse(row.value))
    : c.json({ ok: false, reason: "No scheduled health result yet" }, 503);
});
app.all("/mcp", async (c) => {
  const transport = new StreamableHTTPTransport({
    sessionIdGenerator: undefined,
  });
  const server = createServer(new Runtime(c.env));
  await server.connect(transport);
  return transport.handleRequest(c);
});
export default {
  fetch: app.fetch,
  async scheduled(
    _event: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(
      (async () => {
        const result = await new Runtime(env).health();
        await env.DB.prepare("INSERT OR REPLACE INTO cache VALUES(?,?,?)")
          .bind("last-health", JSON.stringify(result), Date.now() + 172800000)
          .run();
        await env.DB.prepare(
          "DELETE FROM limits WHERE CAST(substr(key,1,instr(key,':')-1) AS INTEGER)<?",
        )
          .bind(Math.floor(Date.now() / 60000) - 5)
          .run();
        console.log(JSON.stringify({ event: "health", ...result }));
      })(),
    );
  },
};
