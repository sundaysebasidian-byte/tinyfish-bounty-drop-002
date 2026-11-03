import { z } from "zod";
export const ORIGIN = "https://princecharlescinema.com";
export const id = z.string().regex(/^\d{1,10}$/);
export const filmInput = z.object({ film_id: id });
export const provenance = {
    source_url: z.string().url(),
    checked_at: z.string().datetime(),
};
export const film = z.object({
    film_id: id,
    title: z.string().min(1),
    url: z.string().url(),
});
export const searchOutput = z.object({
    ...provenance,
    films: z.array(film),
    total_in_programme: z.number().int().positive(),
    indexed_matches: z.number().int().nonnegative(),
});
export const filmOutput = z.object({
    ...provenance,
    film_id: id,
    title: z.string().min(1),
    year: z.number().int().min(1880).max(2100),
    runtime_minutes: z.number().int().positive(),
    certificate: z.string().min(1),
    country: z.string().min(1),
    genre: z.string().min(1),
    director: z.string().min(1),
});
export const screening = z.object({
    performance_id: id,
    date_label: z.string().min(5),
    time: z.string().regex(/^\d{1,2}:\d{2}\s*[ap]m$/i),
    tags: z.array(z.string()),
    booking_url: z.string().url(),
});
export const screeningsOutput = z.object({
    ...provenance,
    film_id: id,
    timezone: z.literal("Europe/London"),
    screenings: z.array(screening).min(1),
});
export const modifier = z.enum(["35mm", "70mm", "4K", "HOH"]);
export const filterInput = z.object({ modifier, offset: z.number().int().nonnegative().default(0), limit: z.number().int().min(1).max(300).default(100) });
export const filterData = z.object({
    modifier,
    filter_applied: z.literal(true),
    empty_state_message: z.string(),
    films: z.array(film),
    interaction: z.string().min(10),
    result_state: z.enum(["matches", "no_matches"]),
});
export const legacyFilterOutput = filterData.extend({
    ...provenance,
    cached: z.boolean(),
    run_id: z.string().min(1),
});
export const healthOutput = z.object({
    checked_at: z.string().datetime(),
    ok: z.boolean(),
    tools: z.array(z.object({
        tool: z.string(),
        ok: z.boolean(),
        code: z.string().optional(),
        reason: z.string(),
        duration_ms: z.number(),
    })),
});
export class ToolError extends Error {
    constructor(public code: string, message: string) {
        super(message);
    }
}
export function fault(e: unknown) {
    return {
        code: e instanceof ToolError
            ? e.code
            : e instanceof z.ZodError
                ? "SITE_CHANGED"
                : "UPSTREAM_ERROR",
        message: e instanceof ToolError
            ? e.message
            : e instanceof z.ZodError
                ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
                : "Upstream request failed; no result inferred",
    };
}
export const filterOutput = z.object({ ...provenance, modifier, films: z.array(film), total: z.number().int().nonnegative(), offset: z.number().int(), limit: z.number().int(), next_offset: z.number().int().nullable() });
export const pendingOutput = z.object({ status: z.literal("PENDING"), run_id: z.string(), source: z.string().url() });
const completedFilter = legacyFilterOutput.extend({ status: z.literal("COMPLETED"), total: z.number().int().nonnegative(), offset: z.number().int(), limit: z.number().int(), next_offset: z.number().int().nullable() });
const agentResult = z.union([pendingOutput, completedFilter]);
// MCP SDK output schemas must be objects, not top-level unions.
export const agentFilterOutput = completedFilter.partial().extend({ status: z.enum(["PENDING", "COMPLETED"]), run_id: z.string().min(1), source: z.string().url().optional() }).superRefine((value, ctx) => { const r = agentResult.safeParse(value); if (!r.success)
    for (const issue of r.error.issues)
        ctx.addIssue({ code: "custom", message: issue.message, path: issue.path }); });
