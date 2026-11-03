# Bounty Drop 002: Overview

Three entries: **Site to MCP**, **Time Machine**, **TinyVerify**. Deadline: Tue 17 Nov 2026. Today: Tue 3 Nov 2026.

## Bounty choice

Keep the three. Reasons not to switch:

- **Property Dossier** depends on county assessor and recorder sites. US records are split across about 3,000 county systems, and most of them are form or JS portals, so the build would lean on the Agent and burn the $11 wallet. A demo would look good for one county only.
- **Get My Data Out** works behind logins (Vault or Browser Context Profiles). Demos would show personal accounts, every run is a paid Agent run, and "safe by default" is hard to show.
- **Time Machine** is the bounty that fits TinyFish most directly: Monitor plus Browser screenshots. That likely makes it the most crowded, so its angle (a tamper-evident, screenshot-backed history) has to stay sharp. **TinyVerify** can run almost entirely on free Fetch, which makes it the cheapest to make excellent.

Note: the Student Program blog says "every build that meets the criteria is approved … $50 per agentic app" (https://www.tinyfish.ai/blog/tinyfish-student-program), while Drop 001 also announced places ("1st place Openings…"). Ask the user which rules apply to Drop 002 (see Asks below).

## Stack (all three apps)

| Layer | Choice | Why |
|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | One install, per-app Vercel projects |
| App framework | Next.js (latest stable, App Router, TypeScript strict) | One stack, Route Handlers for APIs and MCP |
| Styling | Tailwind CSS v4 + shared `@hackerson/ui` tokens | Sonnet polishes one design system for all three |
| Hosting | Vercel Hobby, 3 projects (Root Directory = `apps/<name>`) | Free; Node runtime needed for `playwright-core` (Time Machine) |
| KV | Upstash Redis via Vercel Marketplace (free tier), `@upstash/redis` | Manifests, receipts, timelines, rate limits, budget counters |
| Blobs | Vercel Blob (Time Machine only) | Screenshots and snapshot text |
| MCP | `mcp-handler@^2` + `@modelcontextprotocol/server@^2` + `zod@^4` | Web-standard handler that serves the 2026-07-28 spec and the 2025 Streamable HTTP spec (https://github.com/vercel-labs/mcp-handler) |
| Tests | Vitest (unit, against recorded fixtures) + one live smoke script per app | Deterministic CI; live check before demo |
| TinyFish access | Thin REST client in `packages/tinyfish` (no SDK dependency) | Request shapes verified below; per-call key (BYOK); budget guard; any runtime |

Why REST rather than `@tiny-fish/sdk`: we need a per-request API key (bring-your-own-key, BYOK), a shared budget guard and uniform timeouts. The SDK is acceptable inside an app if the executor prefers it, but every paid call **must** go through the guard in `packages/tinyfish`.

## Monorepo layout

```
.
├─ apps/
│  ├─ site-to-mcp/      # see site-to-mcp.md
│  ├─ time-machine/     # see time-machine.md
│  └─ tinyverify/       # see tinyverify.md
├─ packages/
│  ├─ tinyfish/         # @hackerson/tinyfish: REST client + budget guard
│  ├─ ui/               # @hackerson/ui: Tailwind preset, tokens, 8 primitives
│  └─ config/           # tsconfig.base.json, eslint, vitest base
├─ docs/plans/
├─ .env.example         # names only, never values
├─ turbo.json  pnpm-workspace.yaml  package.json
└─ README.md            # links to the three apps
```

`.gitignore` must include `.env*` (except `.env.example`), `.vercel`, `fixtures/live/`.

## Shared package: `@hackerson/tinyfish`

All endpoints and headers were verified against the docs on 2026-11-03. Auth is the `X-API-Key: <key>` header on every call (https://docs.tinyfish.ai/for-coding-agents).

| Method | HTTP | Doc |
|---|---|---|
| `search(p)` | `GET https://api.search.tinyfish.ai?query=…&location=&language=&include_domains=&exclude_domains=&page=` | https://docs.tinyfish.ai/search-api/reference |
| `fetch(p)` | `POST https://api.fetch.tinyfish.ai` body `{urls[≤10], format: "markdown"\|"html"\|"json", links, image_links, iframe_links, ttl, per_url_timeout_ms, include_selectors, exclude_selectors, purpose, include_etag_and_last_modified}` → `{results[], errors[]}` | https://docs.tinyfish.ai/fetch-api/reference |
| `agent.run(b)` | `POST https://agent.tinyfish.ai/v1/automation/run` body `{url, goal, output_schema?, browser_profile?: "lite"\|"stealth", proxy_config?, agent_config?: {max_duration_seconds, max_steps(beta)}, capture_config?}` | https://docs.tinyfish.ai/agent/api/agent/endpoints |
| `agent.queue(b)` / `runs.get(id)` | `POST …/v1/automation/run-async` → `{run_id}`; `GET https://agent.tinyfish.ai/v1/runs/{id}` | https://docs.tinyfish.ai/agent/api/runs |
| `browser.create(b)` | `POST https://api.browser.tinyfish.ai` body `{url?, timeout_seconds?, proxy_config?}` → `201 {session_id, cdp_url, base_url}` | https://docs.tinyfish.ai/browser-api/reference |
| `browser.terminate(id)` | `DELETE https://api.browser.tinyfish.ai/{session_id}` → 204 | same |
| `monitors.create(b)` | `POST https://agent.tinyfish.ai/v1/monitors` body `{type:"fetch", name, config:{url, format}, schedule_cron, purpose?, webhook_url?}` → `201 {monitor, run}` | https://docs.tinyfish.ai/monitor/api-reference |
| `monitors.runNow(id)` | `POST …/v1/monitors/{id}/runs` → `201 {run}` | same |
| `monitors.get/list/update/delete` | `GET/PATCH/DELETE …/v1/monitors[/{id}]` | same |
| `wallet.get()` | `GET https://agent.tinyfish.ai/v1/wallet` | https://docs.tinyfish.ai/wallet |

```ts
// packages/tinyfish/src/index.ts
export interface BudgetGuard {
  /** Throws PaidCallRefused if the call is not allowed. kind is used for daily caps. */
  assertPaidAllowed(kind: "agent" | "browser" | "monitor", estUsd: number): Promise<void>;
  record(kind: "agent" | "browser" | "monitor", estUsd: number): Promise<void>;
}
export interface TinyFishOptions { apiKey: string; guard?: BudgetGuard; fetchImpl?: typeof fetch; userAgent?: string }
export class TinyFishError extends Error { status: number; code?: string; requestId?: string }
export class PaidCallRefused extends Error { reason: "disabled" | "daily_cap" | "wallet_floor" }
export function createTinyFish(opts: TinyFishOptions): TinyFish;
export function redisBudgetGuard(redis: Redis, cfg: { enabled: boolean; walletFloorUsd: number; dailyCaps: Record<"agent"|"browser"|"monitor", number> }, tf: () => TinyFish): BudgetGuard;
export function parseJsonFromFetch(text: string): unknown; // see the JSON-through-Fetch note below
```

Rules:
- Timeouts: search 10 s, fetch 150 s, agent 120 s, browser create 60 s (values from the docs).
- Retry only on 429/503 with `Retry-After`, at most 2 times. **Never retry agent runs automatically.**
- Paid calls (`agent.*`, `browser.create`, `monitors.create`, `monitors.runNow`) call `guard.assertPaidAllowed` first. Defaults: `PAID_CALLS_ENABLED=false` in preview deploys, and a wallet floor of $3 (`wallet.get()` is cached for 5 minutes).
- A BYOK key passed by the caller is used for that call only. It is never logged and never stored. A BYOK call skips the daily caps but keeps the `enabled` check.
- **JSON-through-Fetch note:** markdown output showed backslash-escaped underscores in JSON bodies (`result\_count`). `parseJsonFromFetch` tries `JSON.parse(text)` first, then unescapes markdown escapes (`/\\([\\`*_{}\[\]()#+\-.!|>~])/g → "$1"`) and parses again. The executor should also test `format:"html"` on a JSON URL and keep whichever parses cleanly. Lock the behaviour in with a fixture test.

## Shared package: `@hackerson/ui`

Tokens: one neutral scale (zinc), one accent per app (Site to MCP indigo-600, Time Machine amber-600, TinyVerify emerald-600) and semantic status colours (ok/warn/bad/unknown). Type: Inter or Geist for UI, Geist Mono for URLs, hashes and code. Primitives: `Shell` (centred max-w-5xl, generous top space), `Input`, `Button`, `Badge` (status/cost), `Card`, `CodeBlock` (with copy), `Tabs`, `Skeleton`. No marketing sections, taglines or helper paragraphs unless a plan names them.

## Safe-by-default checklist (all apps)

1. Read-only: no tool, adapter or monitor ever submits POST forms, logs in or writes to a third-party site.
2. Paid primitives are off unless explicitly enabled, capped daily, held above a wallet floor, and labelled with a cost badge in the UI.
3. Respect `robots.txt` (Site to MCP) and registry terms (TinyVerify refuses NMLS).
4. No secrets in the repo; `.env.example` holds names only; BYOK keys are kept in memory only.
5. Per-IP rate limits on every public endpoint (Upstash sliding window).
6. Every result shows its source URL and a retrieval timestamp.

## Build order

| Days (Nov) | Work | Why this order |
|---|---|---|
| 3–4 | Monorepo scaffold, `packages/tinyfish` + tests, `packages/ui` tokens; deploy empty Time Machine; create curated Monitors | Monitors need about 12 days to build up history before the demo |
| 4–7 | TinyVerify MVP end to end (free Fetch only) | Cheapest, fastest to polish |
| 7–10 | Site to MCP MVP (discovery, hosted MCP, connect panel) | Most complex; needs MCP client testing |
| 10–12 | Time Machine UI (timeline, screenshot slider, diff, chain verification) | Real history now exists |
| 12–13 | Sonnet polish pass on all three; DeepSeek review fixes | |
| 14–15 | READMEs, record the 3 videos, X + LinkedIn posts | |
| 16 | Buffer; submit by Mon 16 Nov | One day of slack before the deadline |

## TinyFish spend estimate

Prices are from https://www.tinyfish.ai/pricing: Search and Fetch free (Fetch 1,000 URLs/day, Search 30/min); Agent $0.016/step; Browser $0.002/min; Monitor $0.005/check.

| Item | Calc | USD |
|---|---|---|
| Time Machine curated monitors (2 × every 6 h, 2 × daily, Nov 5–17) | (4+4+1+1) × 12 d × 0.005 | 0.60 |
| Time Machine public slots (≤10 pages, daily, 7-day expiry) | 70 × 0.005 | 0.35 |
| Screenshots on change + baselines (cap 30/day) | ~120 × ~$0.004 (≈2 min) | 0.50 |
| Dev testing: Monitor run-now | 40 × 0.005 | 0.20 |
| Agent: TinyVerify deep check (dev + demo) | ~8 runs × ~12 steps × 0.016 | 1.55 |
| Agent: Site to MCP `act` tool (dev + demo) | ~5 runs × ~10 steps × 0.016 | 0.80 |
| **Total** | | **≈ $4.00** (≈ $7 buffer on $11) |

Hard guards: `DAILY_CAP_AGENT_USD=0.60`, `DAILY_CAP_BROWSER_USD=0.15`, `DAILY_CAP_MONITOR_USD=0.20`, wallet floor $3. The public demos never run the Agent with our key.

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Browser API returns `404 NOT_FOUND` ("not enabled for your account") | Medium | Day-1 check: `POST api.browser.tinyfish.ai` then DELETE. Fallback: Agent `capture_config.screenshots` on change only (pricier), or text-only timeline |
| Monitor webhooks are unsigned (no signature documented) | Certain | Secret token in the webhook URL + payload `fetch_monitor_id` must match the stored id |
| No REST run-history list for Monitors | Certain | We persist every webhook and run-now result ourselves |
| `mcp-handler` v2 / MCP SDK v2 API drift | Medium | Pin exact versions; verify with MCP Inspector and Claude Code on day 7 |
| Registry markup changes (CalBar, Companies House HTML) | Low/Med | Parsers are fixture-tested; adapters return `SOURCE_UNAVAILABLE`, never a false "not found" |
| FINRA JSON endpoint is undocumented | Medium | Label it "official source, undocumented interface"; fall back to the human page link |
| Fetch daily limit (1,000 URLs) exhausted by public traffic | Low | Redis counter; above 800/day, public endpoints ask for BYOK |
| Vercel Hobby function duration | Low | `export const maxDuration = 60`; screenshot work runs in `after()` |

## Asks for the user

1. **Detailed bounty briefs** and judging rules for Site to MCP, Time Machine and TinyVerify (required features, submission form fields). Is it "top 3 per bounty" or "every approved build"?
2. **TinyFish API key** in `.env.local` as `TINYFISH_API_KEY` (never pasted in chat). Approval to spend about $4 of the $11 wallet.
3. **Vercel account** (3 projects), **Upstash Redis** and **Vercel Blob** stores created from the Vercel Marketplace; the env vars they generate.
4. **GitHub**: one public monorepo or three repos? (Recommended: one monorepo, three Vercel projects; each README section deep-links.) Repo name and owner.
5. X and LinkedIn handles to tag; whether to tag @Tiny_Fish.
6. Optional custom domains.

## Env vars (`.env.example`, names only)

```
TINYFISH_API_KEY=
PAID_CALLS_ENABLED=false
WALLET_FLOOR_USD=3
DAILY_CAP_AGENT_USD=0.60
DAILY_CAP_BROWSER_USD=0.15
DAILY_CAP_MONITOR_USD=0.20
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
BLOB_READ_WRITE_TOKEN=          # time-machine only
WEBHOOK_SECRET=                 # time-machine only, 32+ random bytes
ADMIN_TOKEN=                    # gates admin routes (seed monitors, enable paid features)
PUBLIC_BASE_URL=
```

## Submission kit (each app)

- README: one-line pitch, 20-second GIF, "How it uses TinyFish" table (primitive → where → cost), safe-by-default section, local setup (3 commands), architecture diagram (mermaid), limits.
- 60–90 s video (script in each plan). Record at 1440×900, browser zoom 110%, no voice-over required; captions burned in.
- X post: pitch + GIF + live URL + repo. LinkedIn post: problem → what it does → how TinyFish makes it possible → link.

## Doc URLs used

- https://docs.tinyfish.ai/llms.txt (index) · https://docs.tinyfish.ai/for-coding-agents
- https://docs.tinyfish.ai/fetch-api/reference · https://docs.tinyfish.ai/search-api/reference
- https://docs.tinyfish.ai/monitor/index.md · https://docs.tinyfish.ai/monitor/api-reference.md
- https://docs.tinyfish.ai/browser-api/reference.md
- https://docs.tinyfish.ai/agent/api/agent/endpoints · https://docs.tinyfish.ai/agent/api/runs · https://docs.tinyfish.ai/faq
- https://docs.tinyfish.ai/wallet · https://www.tinyfish.ai/pricing
- https://github.com/vercel-labs/mcp-handler · https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
