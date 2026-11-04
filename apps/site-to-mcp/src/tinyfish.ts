import { z } from "zod";
import { ORIGIN, ToolError } from "./schema.js";
import { allowedByRobots } from "./parse.js";
const pageSchema = z.object({
    results: z.array(z.object({
        url: z.string(),
        final_url: z.string(),
        text: z.string(),
        links: z.array(z.string()).optional(),
    })),
    errors: z.array(z.object({ url: z.string(), error: z.string() })),
});
export class TinyFish {
    constructor(private key: string) { }
    async request(url: string, body?: unknown, timeoutMs = 20000) {
        let r: Response;
        try {
            r = await fetch(url, {
                method: body ? "POST" : "GET",
                headers: { "X-API-Key": this.key, "Content-Type": "application/json" },
                body: body ? JSON.stringify(body) : undefined,
                signal: AbortSignal.timeout(timeoutMs),
            });
        }
        catch {
            throw new ToolError("UPSTREAM_TIMEOUT", "TinyFish request failed or timed out; no automatic retry");
        }
        if (!r.ok)
            throw new ToolError("TINYFISH_HTTP", `TinyFish returned HTTP ${r.status}`);
        return r.json() as Promise<unknown>;
    }
    async raw(url: string, html = true) {
        const d = pageSchema.parse(await this.request("https://api.fetch.tinyfish.ai", {
            urls: [url],
            format: html ? "html" : "markdown",
            ...(html ? { include_selectors: ["body"] } : {}),
            links: true,
            ttl: 300,
            per_url_timeout_ms: html ? 30000 : 5000,
        }, html ? 40000 : 10000));
        if (d.errors.length)
            throw new ToolError(d.errors[0].error === "selector_not_matched"
                ? "SITE_CHANGED"
                : "FETCH_FAILED", `Fetch ${d.errors[0].error} at ${url}`);
        const p = d.results[0];
        if (!p || new URL(p.final_url).origin !== ORIGIN)
            throw new ToolError("SITE_CHANGED", "Missing response or off-site redirect");
        return p;
    }
    async page(url: string) {
        if (new URL(url).origin !== ORIGIN)
            throw new ToolError("INVALID_INPUT", "Only Prince Charles Cinema URLs are permitted");
        const robots = await this.raw(`${ORIGIN}/robots.txt`, false);
        if (!allowedByRobots(robots.text, new URL(url).pathname))
            throw new ToolError("ROBOTS_DENIED", "Path disallowed by robots.txt");
        return this.raw(url);
    }
    async search(query: string) {
        const u = new URL("https://api.search.tinyfish.ai");
        u.searchParams.set("query", `site:princecharlescinema.com/film/ ${query}`);
        u.searchParams.set("include_domains", "princecharlescinema.com");
        const d = z
            .object({
            results: z.array(z.object({ url: z.string(), title: z.string() })),
        })
            .parse(await this.request(u.href));
        return d.results.filter((r) => {
            try {
                return (new URL(r.url).origin === ORIGIN &&
                    /^\/film\/\d+\//.test(new URL(r.url).pathname));
            }
            catch {
                return false;
            }
        });
    }
    async agent(url: string, goal: string) {
        return z.object({ run_id: z.string().min(1) }).parse(await this.request("https://agent.tinyfish.ai/v1/automation/run-async", {
            url, goal, browser_profile: "lite", agent_config: { max_duration_seconds: 90 },
            output_schema: { type: "object", properties: { modifier: { type: "string" }, filter_applied: { type: "boolean" }, empty_state_message: { type: "string" }, films: { type: "array", items: { type: "object", properties: { film_id: { type: "string" }, title: { type: "string" }, url: { type: "string" } }, required: ["film_id", "title", "url"] } }, interaction: { type: "string" }, result_state: { type: "string", enum: ["matches", "no_matches"] } }, required: ["modifier", "filter_applied", "empty_state_message", "films", "interaction", "result_state"] }
        }));
    }
    async getRun(runId: string) {
        return z.object({ run_id: z.string(), status: z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"]), num_of_steps: z.number().int().nonnegative().nullable().optional(), result: z.unknown() }).parse(await this.request(`https://agent.tinyfish.ai/v1/runs/${encodeURIComponent(runId)}?screenshots=none&html=none`));
    }
}
