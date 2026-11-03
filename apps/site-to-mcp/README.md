# Prince Charles Cinema → MCP

A focused MCP server for planning a trip to London's repertory cinema: discover films, read facts, compare formats and screenings, then apply the live format filter. Every result is typed, source-linked and timestamped. No raw page dumps, accounts, seat selection or checkout.

**Live MCP:** https://site-to-mcp-pcc.sundaysebasidian.workers.dev/mcp
**Landing page:** https://site-to-mcp-pcc.sundaysebasidian.workers.dev/

## Current acceptance status

Search, Fetch and Agent are verified live, alongside the real MCP-client conversation, HTTP/stdio transports, offline tests and deployment. The Agent applied the 35mm filter in **8 steps ($0.128)** and returned 10 films, using a 90-second configured duration bound. Known TinyFish spend is **$0.400**, including the lead’s reported 10-step $0.160 probe and a 7-step $0.112 attempt that failed acceptance. See [verification](docs/verification.md) for recorded steps, cost, Fetch cross-checks and health results.

## Why this website

TinyFish Fetch tested four real candidates on 3 November 2026:

| Candidate             | Fetch result                                                                         | Decision                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Prince Charles Cinema | Homepage, complete programme, film detail, booking shell readable; 295 current films | Selected: valuable repertory/35mm discovery, stable numeric film/performance IDs, server-rendered read data and JS-dependent programme filter |
| Genesis Cinema        | Homepage readable, large event catalogue                                             | Viable runner-up; PCC offered clearer film/format/performance structure                                                                       |
| Regent Street Cinema  | `empty_content`                                                                      | Rejected: unreliable Fetch path                                                                                                               |
| BFI What's On         | `bot_blocked`                                                                        | Rejected: read tools would need a paid browser                                                                                                |

We inspected the sites/navigation and searched their official domains for API documentation. No public documented programme/ticket API was found for PCC, Genesis or Regent Street. This is a bounded discovery finding, not proof that private/internal APIs do not exist. PCC uses WordPress for editorial content; the generic WordPress content API does not supply its Jacro cinema programme or live ticket interface. The server uses the public website, not undocumented ticket endpoints. See [selection evidence](docs/site-selection.md).

Fetch with `include_selectors: ["body"]` preserves the real attributes needed by deterministic Cheerio parsers. Automatic boilerplate extraction loses these attributes; the included regression fixtures record the successful shape. Robots explicitly disallows `/prince-charles-cinema/booknow/`; no tool fetches or visits that path. Screening URLs are returned as user-facing links only. Film facts and screenings are separate tools because their outputs answer different agent decisions.

## Tools

All inputs and successful outputs have Zod validation and MCP `inputSchema` / `outputSchema`; results use `structuredContent`. All tools have read-only, non-destructive annotations.

| Signature                                                      | Output                                                                                                     | Real TinyFish work                                                                                                            |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `search_films({query: string[2..100]})`                        | `{films: {film_id,title,url}[], total_in_programme, indexed_matches, source_url, checked_at}`              | Search discovers indexed film pages; Fetch reads the complete current programme to validate current title matches             |
| `get_film({film_id: numericString})`                           | `{film_id,title,year,runtime_minutes,certificate,country,genre,director,source_url,checked_at}`            | Fetch resolves the ID from the current programme and reads `.plot`                                                            |
| `get_screenings({film_id: numericString})`                     | `{film_id,timezone,screenings: {performance_id,date_label,time,tags,booking_url}[],source_url,checked_at}` | Fetch reads actual `.date-row` blocks, deduplicating desktop/mobile copies                                                    |
| `filter_programme({modifier: "35mm" / "70mm" / "4K" / "HOH"})` | `{modifier,films:{film_id,title,url}[],result_state,filter_applied,empty_state_message,interaction,cached,run_id,source_url,checked_at}`      | Agent opens the JS Filter By Modifier panel, selects the modifier, clicks Apply, and reads only visible film cards (up to 10) |
| `health_check({})`                                             | `{ok,checked_at,tools: {tool,ok,code?,reason,duration_ms}[]}`                                              | Runs the four tools, validates their schemas and known-input sanity                                                           |

Times are source labels in **Europe/London**. We do not invent a year or interpret an ambiguous source label. `get_screenings` lists booking links, not remaining seats. `filter_programme` verifies the actual interactive view, which has no shareable GET filter URL; it does not infer results from hidden cards. A 6-hour cache is labelled with its original timestamp. Browser is deliberately omitted: another screenshot endpoint adds no useful agent capability to this workflow. Three endpoint integrations: Search, Fetch and Agent verified live.

## Install

Node **24+** and npm. This directory is an independent npm project; no monorepo packages or globally installed binaries needed.

```sh
cd apps/site-to-mcp
npm ci
npm exec -- site-to-mcp
# or from the repository root:
npx --prefix ./apps/site-to-mcp site-to-mcp
```

Without a TinyFish key, the stdio entry bridges the same hosted typed tools and central budget ledger. For a **standalone local server**, set `TINYFISH_API_KEY` in the process environment; the stdio entry runs the same extraction runtime with a persistent `.local-state.sqlite` budget/cache. Paid calls default to disabled locally; opt in with `PAID_CALLS_ENABLED=true` only with a separately allocated budget. Do not run local and production paid budgets against the same $2 allocation: they are separate ledgers. Local paid events append `.cost-log.jsonl`. Neither the bridge nor hosted connection requires client secrets.

### Claude Code

```sh
claude mcp add --transport http pcc https://site-to-mcp-pcc.sundaysebasidian.workers.dev/mcp
# local stdio, run inside this directory:
claude mcp add --transport stdio pcc-local -- npx --prefix "$PWD" site-to-mcp
```

### Claude Desktop

Add to `claude_desktop_config.json` (replace the path with your checkout):

```json
{
  "mcpServers": {
    "pcc": {
      "command": "npx",
      "args": ["--prefix", "/absolute/path/to/apps/site-to-mcp", "site-to-mcp"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "pcc": { "url": "https://site-to-mcp-pcc.sundaysebasidian.workers.dev/mcp" }
  }
}
```

### ChatGPT

In Settings → Apps / connectors, enable developer mode where available; create a custom MCP app with `https://site-to-mcp-pcc.sundaysebasidian.workers.dev/mcp`, authentication **None**. Availability depends on your plan/workspace policy. Enable the app in a conversation and ask the example below. No OAuth credentials are required by this server.

> Find Akira, check its runtime and director, compare the first two 35mm screenings, then apply the 70mm programme filter. Cite sources and timestamps.

The [real client conversation](docs/demo-transcript.md) records actual tool use; setup snippets for other clients are not claims of testing them.

## Health and drift

```sh
npm test
npm run typecheck
npm run build
npm run health  # hosted health_check through the MCP SDK; nonzero exit if any tool fails
```

The Worker cron runs daily at **08:00 UTC**, invokes the same health function, stores the report, and emits a structured log. `GET /health` exposes the last scheduled report, not a fabricated green status. The health tool does not recursively call itself. The read tools execute against known Akira inputs; the Agent applies the known 35mm filter; schema validation and title/match sanity identify exactly which tool failed. Paid tool cache use is explicit in the report; a budget/rate/disabled error is a failed check, never silently skipped. When the known film leaves the programme, update the health fixture deliberately after checking a new real film.

Missing selectors, malformed film facts, unknown booking-link shape, removed screenings, invalid modifier results or unexpected redirects fail loudly. MCP tool errors have `isError: true` and `{error:{code,message}}`, including `SITE_CHANGED`, `FETCH_FAILED`, `ROBOTS_DENIED`, `NOT_IN_PROGRAMME`, `INVALID_INPUT`, `AGENT_FAILED`, `PAID_DISABLED`, and `BUDGET_OR_RATE_LIMIT`. An unmatched user search is a valid explicit `films: []` only after a nonempty live programme was validated. An empty programme is always an error.

## Budget and safety

- $2 hard allocation; stop admitting runs at **$1.60**. Atomic D1 reservation of **$0.32** per Agent call (a cost estimate), settled to `num_of_steps × $0.016`. No automatic paid retry. A gateway timeout triggers bounded read-only recovery of the original run via the Runs API; unresolved failures retain their full reservation.
- Runs use `agent_config.max_duration_seconds:90` and a concise read-only goal targeting roughly 10 steps. Duration is the accepted execution bound; the reservation is an estimate, not a provider-enforced dollar limit. Reported costs above the estimate are fully charged to the ledger and stop subsequent admissions at the threshold.
- One new Agent run per ten minutes globally; cached filter results expire after six hours. All public routes share a 60-requests/minute/IP limit. Paid calls also require `PAID_CALLS_ENABLED=true`.
- Production cost events persist in D1 `costs`, reservations in `budget`. Export them to the required gitignored `.cost-log.jsonl` using the command below. No credentials are logged.
- Numeric IDs resolve through the source catalogue and the programme's own film links. Caller URLs and free-form Agent goals are never accepted. Robots is checked through TinyFish Fetch before reading paths. Foreign `Origin` headers are rejected.
- The Agent is explicitly forbidden from selecting seats/quantities, adding to basket, reserving, purchasing, logging in or submitting forms. Site content is untrusted. Read-only browsing is the only intended action.

```sh
npx tsx scripts/export-costs.ts
# With TINYFISH_API_KEY in the process environment, cross-check cached Agent cards:
npx tsx scripts/verify-agent.ts
```

## Deploy your own

```sh
npm ci
npx wrangler d1 create your-site-to-mcp
# update wrangler.toml: account_id, database_name, database_id and Worker name
npx wrangler d1 execute your-site-to-mcp --remote --file schema.sql
npx wrangler secret put TINYFISH_API_KEY  # private input, never paste into code/config
npx wrangler types --env-interface Env --include-runtime false
npm run deploy
```

The key in the main checkout is never copied into tracked files. `.dev.vars`, SQLite state, Wrangler state, raw large Fetch probes and cost logs are ignored. Configure your own endpoint through `SITE_TO_MCP_URL` for the stdio bridge and health CLI. The local `bin` uses source via the pinned `tsx` dependency, so `npx` works immediately after `npm ci`.

## Submission boundary

No GitHub repository, push, LinkedIn/Discord post or bounty submission is performed. Registration/individual-entry eligibility and mandatory public submission posts remain the entrant's responsibility. Generic site-to-server generation is intentionally out of scope after the curated-server pivot.

API references verified against [TinyFish full docs](https://docs.tinyfish.ai/llms-full.txt): [Fetch](https://docs.tinyfish.ai/fetch-api/reference), [Search](https://docs.tinyfish.ai/search-api/reference), [Agent](https://docs.tinyfish.ai/agent/api/agent), [step limits](https://docs.tinyfish.ai/agent/explanation/agent-modes).
