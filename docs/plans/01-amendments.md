# Amendments — these OVERRIDE the plans where they conflict

Read first: `docs/briefs/*.md` (official bounty briefs + rulebook + budget). Every requirement and approval criterion in a brief is mandatory; a single failed criterion = rejected.

## A. Infra (all three builds)
- **Hosting: Cloudflare, not Vercel.** `npx wrangler` is already logged in (account `8f236662adb381d7fc8ef1e68d93d0af`). Use Workers (TypeScript, Hono) + static assets, D1 for structured data, KV or R2 for screenshots/blobs (try R2; if R2 is not enabled on the account fall back to KV). Workers cron triggers replace Vercel cron. No Upstash/Vercel Blob.
- **Each app is self-contained** in `apps/<name>/` with its own `package.json`, lockfile, README and `wrangler.toml` — no shared workspace packages (copy the small TinyFish client into each app's `src/tinyfish.ts`). This lets each bounty be submitted and installed on its own and lets the three apps be built in parallel without conflicts. Package manager: npm.
- Secrets: `TINYFISH_API_KEY` is in repo-root `.env.local` (gitignored). Locally load it from there; in prod set it with `wrangler secret put`. Never print it, never commit it.
- Paid-call guard from the plan stays (block paid calls unless enabled, cost log in `.cost-log.jsonl`, stop at 80% of the per-app cap in `docs/briefs/budget.md`).
- TinyFish REST: search is `GET https://api.search.tinyfish.ai?query=...` with header `X-API-Key` (verified 200). Verify the others against docs.tinyfish.ai.
- Do not create GitHub repos, push, or post anywhere. Commit locally on the current branch only when your task says so.

## B. Time Machine (URGENT — monitors must be live by Nov 5)
- **≥20 curated pages, not 4** (brief req. 1). Choose pages someone genuinely needs a history of, across the brief's categories: SaaS pricing pages, privacy policies / ToS, visa & immigration rule pages, insurance coverage pages, menu prices. Fetch-verify each one (reachable, not bot-blocked, meaningful text). Aim for ~24 so a few failures still leave ≥20.
- Schedules: ~8 high-churn pages every 6h, the rest daily. Stay within the $4 cap (each check $0.005; first 72h of each monitor free).
- Public "track a page" stays (criterion 3: works for any page you add) but cap it at 3 public slots, daily, 7-day expiry. BYOK stretch stays.
- Endpoints doing real work: Monitor (core), Fetch (baseline/normalisation if needed), Browser (screenshot on change), Search (e.g. "find the pricing/terms page for <company>" when adding a page by company name). That makes 4 — keep each one genuinely useful.
- Required API endpoints (criterion 5): list pages, page timeline, as-of (`?at=ISO date` → the version live at that time, with screenshot + source link), diff between two dates (structured added/removed/changed blocks, noise filtered), JSON export. Document them in the README with curl examples.
- Keep a public change log (brief req. 5: "logs of the real changes it caught").
- README must include the short explanation of how Monitor (and Fetch/Browser/Search) are used (req. 6).

## C. Site to MCP — PIVOT
The brief wants a **specific real website with no public API** wrapped as a permanent MCP tool with ≥3 hand-designed typed tools, and it requires the **Agent** to be used meaningfully. The plan's demo sites mostly HAVE public APIs (Companies House, Wikipedia, HN) or are licence registries (CalBar — excluded by the brief). So:
- **MVP = one curated MCP server for one high-value site with no public API** (not licence/property). Pick it by Fetch-verifying 3–5 candidates; criteria: genuinely useful to agents, no official API, data reachable by URL/GET for most tools, stable markup. Examples of the shape: a university course catalogue, a city events calendar, a sports/court booking availability page, a public library catalogue, a transit/ferry timetable. Do not copy the brief's examples literally unless clearly the best choice.
- **≥3 tools (aim 4–5)** with action-oriented names, zod-typed inputs and typed structured outputs (outputSchema / structuredContent), never raw page dumps. Fetch powers the read tools; **at least one tool uses the TinyFish Agent** for a step that genuinely needs clicking/JS (e.g. checking availability behind a form). Run that Agent tool with the server's key, cache results, rate-limit it.
- **Health check** (brief req. 4 / criterion 4): a `health_check` tool plus `npm run health` / a scheduled Worker cron that runs each tool against known inputs and validates the output schema + sanity rules; on drift it fails loudly with which tool broke and why. Tools themselves throw clear typed errors (e.g. `SITE_CHANGED: selector X missing`) instead of returning empty results.
- Ship both: hosted Streamable-HTTP endpoint on Cloudflare Workers, and a local stdio entry (`npx`-able from the repo) so another developer can install it tomorrow. README: install snippets for Claude Code, Claude Desktop, Cursor, ChatGPT connectors.
- The plan's generic "paste any URL → generated tools" generator becomes a **stretch goal only**, after the curated server fully passes the brief.
- Endpoints: Fetch + Agent required; add Search (e.g. a site-scoped search tool) and Browser only where they do real work.

## D. TinyVerify
- Plan is broadly right. Make sure: input = name + record type + jurisdiction (req. 1); ≥2 registries — aim for as many as the plan's Fetch-able list allows (coverage is a judging criterion); structured record with status, number, expiry, disciplinary actions, source link, checked_at (req. 3); **Monitor flags status changes** (req. 4) — create a Monitor per watched record, webhook to the Worker, compare status fields; Agent used meaningfully for the JS-only registries (CSLB / TDLR) within the $3 cap.
- Ambiguity: explicit `no_match`, `multiple_matches` (return candidates), name-variant handling; never guess; registry failure ≠ not found.
- Demo with businesses / public entities only; no private individuals' personal data in the demo, README or screenshots (rulebook §7). NPI/FINRA individual lookups may exist in code but demo them with organisations (NPI type-2 organisations, firms).
