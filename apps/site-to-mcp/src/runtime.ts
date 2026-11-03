import type { RuntimeEnv } from "./state.js";
import { z } from "zod";
import { TinyFish } from "./tinyfish.js";
import { catalogue, details, performances } from "./parse.js";
import {
  ORIGIN,
  ToolError,
  id,
  filmInput,
  searchOutput,
  filmOutput,
  screeningsOutput,
  filterOutput,
  filterData,
  filterInput,
  healthOutput,
  fault,
} from "./schema.js";
export const definitions = {
  search_films: {
    description:
      "Find current Prince Charles Cinema films by title. TinyFish Search discovers indexed matches; Fetch validates against the complete live programme. No match is explicit.",
    input: z.object({ query: z.string().trim().min(2).max(100) }),
    output: searchOutput,
  },
  get_film: {
    description:
      "Read film facts: year, runtime, certificate, genre and director from the live Prince Charles Cinema film page.",
    input: filmInput,
    output: filmOutput,
  },
  get_screenings: {
    description:
      "List bookable screenings with date labels, London local times, format tags and exact performance IDs. No seat availability inferred.",
    input: filmInput,
    output: screeningsOutput,
  },
  filter_programme: {
    description:
      "Apply the live JavaScript-only programme modifier filter (35mm, 70mm, 4K or HOH) using TinyFish Agent. Returns visible film cards after clicking Apply, up to 10. Cached 6h; one paid run per 10 minutes; capped budget.",
    input: filterInput,
    output: filterOutput,
  },
  health_check: {
    description:
      "Run all four tools on live known inputs, validate schemas and sanity rules, identify individual failures. Agent may use a timestamped cache; budget failures are unhealthy.",
    input: z.object({}),
    output: healthOutput,
  },
};
export type ToolName = keyof typeof definitions;
export class Runtime {
  tf: TinyFish;
  constructor(private env: RuntimeEnv) {
    this.tf = new TinyFish(env.TINYFISH_API_KEY);
  }
  async programme() {
    return catalogue((await this.tf.page(`${ORIGIN}/whats-on/`)).text);
  }
  async filmPage(film_id: string) {
    const films = await this.programme(),
      f = films.find((f) => f.film_id === film_id);
    if (!f)
      throw new ToolError(
        "NOT_IN_PROGRAMME",
        `Film ${film_id} is not in the current programme`,
      );
    return this.tf.page(f.url);
  }
  async run(name: ToolName, input: unknown): Promise<Record<string, unknown>> {
    const args = definitions[name].input.parse(input);
    let result: unknown;
    if (name === "health_check") return this.health();
    if (name === "search_films") {
      const { query } = definitions.search_films.input.parse(args);
      const [indexed, films] = await Promise.all([
        this.tf.search(query),
        this.programme(),
      ]);
      result = {
        source_url: `${ORIGIN}/whats-on/`,
        checked_at: new Date().toISOString(),
        total_in_programme: films.length,
        indexed_matches: indexed.length,
        films: films.filter((f) =>
          f.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
        ),
      };
    } else if (name === "filter_programme") {
      const a = filterInput.parse(args);
      result = await this.filter(a.modifier);
    } else {
      const { film_id } = filmInput.parse(args),
        p = await this.filmPage(film_id);
      result =
        name === "get_film"
          ? details(p.text, film_id, p.final_url)
          : performances(p.text, film_id, p.final_url);
    }
    return definitions[name].output.parse(result);
  }
  async filter(modifier: string) {
    const source_url = `${ORIGIN}/whats-on/`;
    await this.tf.page(source_url);
    const key = `filter:${modifier}`,
      cached = await this.env.DB.prepare(
        "SELECT value FROM cache WHERE key=? AND expires>?",
      )
        .bind(key, Date.now())
        .first<{ value: string }>();
    if (cached)
      return filterOutput.parse({ ...JSON.parse(cached.value), cached: true });
    if (this.env.PAID_CALLS_ENABLED !== "true")
      throw new ToolError("PAID_DISABLED", "Paid calls are disabled");
    const now = Date.now(),
      runKey = crypto.randomUUID();
    const reservation = await this.env.DB.prepare(
      "UPDATE budget SET reserved_mills=reserved_mills+320,last_call=? WHERE id=1 AND reserved_mills+320<=1600 AND last_call<? RETURNING id",
    )
      .bind(now, now - 600000)
      .first();
    if (!reservation)
      throw new ToolError(
        "BUDGET_OR_RATE_LIMIT",
        "Agent unavailable: $1.60 stop threshold or 10-minute global cooldown",
      );
    await this.env.DB.prepare("INSERT INTO costs VALUES(?,?,?,?,?,?)")
      .bind(runKey, new Date().toISOString(), "agent", 320, null, "reserved")
      .run();
    let run: Awaited<ReturnType<TinyFish["agent"]>>;
    try {
      run = await this.tf.agent(source_url, modifier);
    } catch (e) {
      if (e instanceof ToolError && e.message.includes("HTTP 403")) {
        await this.env.DB.batch([
          this.env.DB.prepare(
            "UPDATE budget SET reserved_mills=reserved_mills-320 WHERE id=1",
          ),
          this.env.DB.prepare(
            "UPDATE costs SET actual_mills=0,status=? WHERE id=?",
          ).bind("refused_403", runKey),
        ]);
      }
      throw e;
    }
    const actual = run.num_of_steps * 16;
    await this.env.DB.batch([
      this.env.DB.prepare(
        "UPDATE budget SET reserved_mills=reserved_mills-? WHERE id=1",
      ).bind(320 - actual),
      this.env.DB.prepare(
        "UPDATE costs SET actual_mills=?,status=? WHERE id=?",
      ).bind(actual, run.status, runKey),
    ]);
    if (run.status !== "COMPLETED")
      throw new ToolError(
        "AGENT_FAILED",
        `Agent ${run.status}; run ${run.run_id}`,
      );
    const data = filterData.parse(run.result);
    if (
      data.modifier !== modifier ||
      (data.result_state === "matches" && !data.films.length) ||
      (data.result_state === "no_matches" &&
        (data.films.length || !data.empty_state_message.trim()))
    )
      throw new ToolError(
        "SITE_CHANGED",
        "Filtered result contradicts selected modifier or result state",
      );
    for (const f of data.films) {
      const u = new URL(f.url);
      if (u.origin !== ORIGIN || !u.pathname.startsWith(`/film/${f.film_id}/`))
        throw new ToolError(
          "SITE_CHANGED",
          "Agent returned invalid film provenance",
        );
    }
    const result = filterOutput.parse({
      ...data,
      source_url,
      checked_at: new Date().toISOString(),
      cached: false,
      run_id: run.run_id,
    });
    await this.env.DB.prepare("INSERT OR REPLACE INTO cache VALUES(?,?,?)")
      .bind(key, JSON.stringify(result), Date.now() + 21600000)
      .run();
    return result;
  }
  async health() {
    const checks: { tool: ToolName; input: unknown }[] = [
      { tool: "search_films", input: { query: "Akira" } },
      { tool: "get_film", input: { film_id: "1808" } },
      { tool: "get_screenings", input: { film_id: "1808" } },
      { tool: "filter_programme", input: { modifier: "35mm" } },
    ];
    const tools = [];
    for (const c of checks) {
      const start = Date.now();
      try {
        const r = await this.run(c.tool, c.input);
        if (
          c.tool === "search_films" &&
          searchOutput.parse(r).films.every((f) => f.film_id !== "1808")
        )
          throw new ToolError("SITE_CHANGED", "Known Akira film missing");
        if (
          c.tool === "filter_programme" &&
          filterOutput.parse(r).result_state !== "matches"
        )
          throw new ToolError(
            "SITE_CHANGED",
            "Known 35mm programme filter returned no matches",
          );
        if (c.tool === "get_film" && filmOutput.parse(r).title !== "Akira")
          throw new ToolError("SITE_CHANGED", "Known film title mismatch");
        tools.push({
          tool: c.tool,
          ok: true,
          reason:
            c.tool === "filter_programme"
              ? `Validated; cached=${r.cached}; source checked_at=${r.checked_at}`
              : "Schema and known-input sanity passed",
          duration_ms: Date.now() - start,
        });
      } catch (e) {
        const f = fault(e);
        tools.push({
          tool: c.tool,
          ok: false,
          code: f.code,
          reason: f.message,
          duration_ms: Date.now() - start,
        });
      }
    }
    return healthOutput.parse({
      checked_at: new Date().toISOString(),
      ok: tools.every((t) => t.ok),
      tools,
    });
  }
}
