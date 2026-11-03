# Site to MCP

Read `00-overview.md` first for the stack, `@hackerson/tinyfish` and the env vars.

## Winning angle

**Pitch:** Paste a URL and get an MCP server your agent can call, built from the site's own search forms and URL patterns, read-only by default.

Why it can place top 3:
- **Tools that are specific, deterministic and auditable.** Most "site to MCP" demos expose one generic `browse(goal)` tool. We generate named, typed tools (`search_companies(q)`, `get_company(company_number)`) from the site's real GET forms, URL templates and sitemap, so any reviewer can trace each tool to a form or link on the page.
- **Every tool is tested before it ships.** Each generated tool is probed once against the live site and only ships if it returns content. The UI shows a verified dot per tool.
- **Free by construction.** Read tools run on TinyFish Fetch and Search (free). The one paid tool (`act`, backed by the Agent) is off by default, needs the caller's own key, and carries a cost badge.
- **Safe by default.** `robots.txt` is respected, POST forms are never submitted, and requests never leave the site's origin. Every tool has MCP annotations `readOnlyHint: true, destructiveHint: false`.
- **Connects in one paste.** The connect panel gives a one-line `claude mcp add` command and Cursor/Claude Desktop JSON.

**Output decision:** both outputs, staged.
- MVP: a **hosted MCP endpoint** per site, `https://<app>/s/{slug}/mcp` (Streamable HTTP, stateless).
- Stretch S1: a **local stdio package**, `npx @hackerson/site-to-mcp {slug}`. It downloads the same manifest and runs the same runtime locally with the user's `TINYFISH_API_KEY`. Because it shares `lib/runtime`, it costs about half a day.

## Scope

**MVP**
1. Generate a manifest from a URL (free Fetch/Search only), streaming progress.
2. Tool kinds: `search_site`, `read_page`, `form` (GET forms), `template` (URL patterns). All read-only.
3. Probe and verify each candidate; drop tools that fail.
4. Hosted MCP endpoint per slug; manifest stored in Redis.
5. Site page: tool list, an inline "Try" console per tool, connect panel.
6. Gallery of four pre-generated sites (demo targets below).
7. Rate limits plus a BYOK header (`X-TinyFish-Key`) on the MCP endpoint.

**Stretch (in order)**
- S1 stdio package via `npx`.
- S2 `act` tool (Agent, paid). Disabled unless the manifest owner enables it **and** the MCP caller sends `X-TinyFish-Key`.
- S3 an optional LLM pass (`ANTHROPIC_API_KEY`) to rewrite tool names and descriptions. Deterministic names remain the fallback.
- S4 manifest editor: rename a tool, hide a tool, edit a description.

**Non-goals**
- Logins, POST forms, cookies or any write action.
- Crawling beyond the homepage, the sitemap's first 500 URLs and up to 3 nav pages.
- Typed structured extraction (tools return markdown plus links).
- User accounts; an "owner" is whoever holds the slug's edit token.
- OAuth on the MCP endpoint.

## Architecture

```
Browser UI ──POST /api/generate (SSE)──▶ discover(url)
                                          ├─ tf.fetch robots.txt
                                          ├─ tf.fetch homepage html, include_selectors:["form"]
                                          ├─ tf.fetch homepage markdown, links:true
                                          ├─ tf.fetch /sitemap.xml (if listed or present)
                                          ├─ inferTemplates(links) + parseForms(html)
                                          ├─ probe each candidate (tf.fetch, ≤8 URLs, parallel batches)
                                          └─ save SiteManifest → Redis site:{slug}

MCP client ──POST /s/{slug}/mcp──▶ load manifest → createMcpHandler(registerTools) → runtime.execute(tool,args)
                                                                                  └─ tf.fetch / tf.search (BYOK or server key)
```

TinyFish calls (shapes verified, see `00-overview.md` for doc URLs):

| Purpose | Call |
|---|---|
| robots | `POST https://api.fetch.tinyfish.ai {urls:[origin+"/robots.txt"], format:"markdown"}`; plain text comes back in `results[0].text` |
| forms | `{urls:[url], format:"html", include_selectors:["form"]}`. **Verified:** forms keep `action`, `method`, `name`, `<select><option>` (Companies House, Wikipedia, HN, CalBar). A total miss returns error `selector_not_matched`, which means no forms |
| links | `{urls:[url], format:"markdown", links:true}` → `results[0].links[]` (absolute) |
| sitemap | `{urls:[origin+"/sitemap.xml"], format:"markdown"}`; parse `<loc>` or URL lines with a regex |
| tool exec (form/template/read) | `{urls:[builtUrl], format:"markdown", links:true, ttl:300, per_url_timeout_ms:45000}` |
| tool exec (search_site) | `GET https://api.search.tinyfish.ai?query=…&include_domains={host}` |
| S2 `act` | `POST https://agent.tinyfish.ai/v1/automation/run {url, goal, browser_profile:"lite", agent_config:{max_duration_seconds:90}}` |

MCP: `mcp-handler@^2` mounted at `app/s/[slug]/mcp/route.ts`. It builds a handler per request from the manifest (stateless) and exports `GET, POST, DELETE`. Validate the `Origin` header when present (spec requirement): allow none, or the app's own origin. Spec: https://modelcontextprotocol.io/specification/2025-11-25/basic/transports.

## Data model

```ts
// lib/types.ts
export type ToolKind = "search_site" | "read_page" | "form" | "template" | "act";
export interface ParamSpec { name: string; description: string; type: "string" | "integer"; enum?: string[]; required: boolean; example?: string }
export interface ToolSpec {
  name: string;            // ^[a-z][a-z0-9_]{0,63}$, unique in manifest
  title: string;
  description: string;     // ≤ 300 chars, starts with a verb, mentions the site name
  kind: ToolKind;
  params: ParamSpec[];
  request?: { urlTemplate: string; fixedQuery?: Record<string, string> }; // form/template
  source: { type: "form" | "link-pattern" | "sitemap" | "builtin"; evidence: string }; // e.g. '<form action="/search">' or 3 example URLs
  cost: "free" | "paid";
  verified: boolean;
  enabled: boolean;
}
export interface SiteManifest {
  slug: string; origin: string; name: string; favicon?: string;
  createdAt: string; generator: "v1";
  robots: { disallow: string[]; fetchedOk: boolean };
  tools: ToolSpec[];
  editTokenHash: string;   // sha256 of the edit token returned once at creation
}
```

Redis keys: `site:{slug}` → JSON manifest; `site:byorigin:{origin}` → slug; `gallery` → list of slugs; `rl:gen:{ip}`, `rl:mcp:{slug}:{ip}`; `budget:fetch:{yyyymmdd}`.

## File tree

```
apps/site-to-mcp/
├─ app/
│  ├─ page.tsx                    # Home: input + gallery
│  ├─ s/[slug]/page.tsx           # Site page: tools, try console, connect
│  ├─ s/[slug]/mcp/route.ts       # Hosted MCP endpoint
│  ├─ api/generate/route.ts       # POST {url} → SSE progress → {slug, editToken}
│  ├─ api/try/route.ts            # POST {slug, tool, args} → ToolResult (same runtime, rate-limited)
│  └─ api/manifest/[slug]/route.ts# GET manifest JSON (for S1 npx)
├─ lib/
│  ├─ discover/robots.ts          # parseRobots(text): {disallow: string[], sitemaps: string[]}; isAllowed(path, rules)
│  ├─ discover/forms.ts           # parseForms(html, baseUrl): FormCandidate[]
│  ├─ discover/templates.ts       # inferTemplates(urls: string[], origin): TemplateCandidate[]
│  ├─ discover/naming.ts          # toolNameFromForm(f, siteName), toolNameFromTemplate(t), uniquify(names)
│  ├─ discover/probe.ts           # probe(cands, tf): Promise<ToolSpec[]>
│  ├─ discover/index.ts           # discover(url, tf, onEvent): Promise<SiteManifest>
│  ├─ runtime/build-url.ts        # buildUrl(spec, args): URL (same-origin + robots enforced)
│  ├─ runtime/execute.ts          # execute(spec, args, ctx): Promise<ToolResult>
│  ├─ runtime/register.ts         # registerTools(server, manifest, ctx): void (zod from ParamSpec)
│  ├─ store.ts                    # getManifest, saveManifest, slugFor(origin)
│  ├─ ratelimit.ts                # @upstash/ratelimit wrappers
│  └─ types.ts
├─ fixtures/                      # recorded Fetch responses (json) for tests
├─ scripts/record-fixtures.ts     # pnpm record-fixtures (uses real key, writes fixtures/)
├─ scripts/seed-gallery.ts        # generates the 4 gallery sites against prod
└─ tests/*.test.ts
packages/site-to-mcp-cli/         # S1: bin "site-to-mcp", stdio server reusing lib/runtime (moved to package when S1 starts)
```

## Key algorithms

**parseForms(html, baseUrl)** using `node-html-parser`:
- For each `<form>`: `method = (attr || "get").toLowerCase()`; resolve `action` against baseUrl (`""` resolves to the page URL); skip it if it is cross-origin, **unless** it is a known search delegate on the same registrable domain. HN posts its search to `hn.algolia.com`, so treat a cross-origin `action` as allowed only when the user confirms, and default to skip.
- Inputs: `input[name]` whose type is not `submit|button|image|reset|file|password`, plus `select[name]` (with an enum from its `option[value]`) and `textarea[name]`. Hidden inputs go to `fixedQuery`.
- Label: `label[for=id]` text, else `placeholder`, else `aria-label`, else `title`, else `name`.
- `method === "post"` → candidate kind `act-only`; list it under "Needs agent" in the UI, disabled.
- Drop forms whose only visible input is a site-wide newsletter or email field (`type=email`).

**inferTemplates(urls, origin)**
- Keep same-origin URLs allowed by robots. Split each into path segments plus sorted query keys.
- A segment is variable if it matches `/^\d+$/`, `/^[A-Z0-9]{6,}$/i` containing a digit, a UUID, or a slug of 3+ hyphenated words.
- Group by the skeleton (literal segments + `{var}` + query keys). Keep groups with ≥2 distinct values for every variable.
- Param name: the previous literal segment, singularised, + `_id` (`/company/{x}` → `company_id`); query vars keep their key (`item?id=` → `id`). Tool name `get_{noun}` (`get_company`, `get_item`). Up to 6 templates, ranked by group size.

**probe(cands)**: build the example URL from the first observed value, or for forms from a site-derived sample term (the site name's first word, or `"test"`). Fetch in batches of ≤10 URLs. `verified = no error && text.length ≥ 200 && !/no results|not found|captcha/i.test(first 500 chars)`. Unverified tools are kept but `enabled:false`.

**execute(spec, args, ctx)**
- `buildUrl` substitutes and encodes params, then asserts that `url.origin === manifest.origin` (except `search_site`) and `isAllowed(url.pathname)`.
- Fetch markdown. Return `{ content:[{type:"text", text: header + body}], structuredContent:{url, final_url, title, links: sameOriginLinks.slice(0,30), truncated} }`, where `header = "Source: {final_url}\nRetrieved: {iso}\n\n"`. The body is truncated to `max_chars` (param, default 8000, max 20000), with `offset` for paging.
- Map Fetch errors to MCP tool errors (`isError: true`) with the TinyFish error code (`bot_blocked`, `login_required`, …).
- The key is `ctx.byokKey ?? process.env.TINYFISH_API_KEY`. Before using the server key, increment `budget:fetch:{day}` and refuse above 800 with the message "Daily free budget reached. Send your TinyFish key in the X-TinyFish-Key header."

**registerTools(server, manifest, ctx)**: for each enabled tool, `server.registerTool(name, { title, description, inputSchema: z.object(shape), annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true } }, (args) => execute(...))`. `shape` is built from `ParamSpec` (`z.string().describe(d)`, `z.enum(...)`, `z.number().int()`; optional when `!required`). Builtins always present: `search_site(query)` and `read_page(path, offset?, max_chars?)`.

## UI screens (content and layout only; Sonnet styles)

1. **Home `/`**
   - Centred: product name (small), one large URL input with a "Generate" button. Nothing else above the fold.
   - Below: a "Gallery" grid of 4 cards (favicon, site name, domain, tool count, verified count).
2. **Generating** (same page, input locked)
   - A vertical step list that fills in live: `robots.txt` · `forms` (n found) · `links` (n) · `sitemap` · `templates` (n) · `probing` (k/n verified). Each step shows a spinner, a check or a muted dash. On done, redirect to `/s/{slug}` and show the edit token once in a dismissible notice.
3. **Site page `/s/{slug}`**
   - Header: favicon, site name, origin (mono), counts "7 tools · 6 verified".
   - Left (2/3): tool list. Each row: name (mono), cost badge (`free` / `paid`), verified dot, one-line description, params as chips. Expanding a row shows the source evidence (form snippet or 3 example URLs) and a **Try** form (inputs from params, Run button, result panel with the source URL and truncated markdown).
   - Right (1/3, sticky): **Connect** card with the endpoint URL plus copy, and tabs `Claude Code` / `Cursor` / `Claude Desktop`, each a `CodeBlock`. Below it, a muted line per disabled item ("2 POST forms skipped").
4. **404 / failure**: the site name with the reason code (`bot_blocked`, `login_required`, `no tools found`) and a "Try another URL" input.

Connect snippets:
```
claude mcp add --transport http {slug} https://<app>/s/{slug}/mcp
```
```json
{ "mcpServers": { "{slug}": { "url": "https://<app>/s/{slug}/mcp" } } }
```
```json
{ "mcpServers": { "{slug}": { "command": "npx", "args": ["-y", "mcp-remote", "https://<app>/s/{slug}/mcp"] } } }
```

## Demo targets (Fetch-verified 2026-11-03)

| Site | Expected tools | Verified evidence |
|---|---|---|
| UK Companies House `https://find-and-update.company-information.service.gov.uk/` | `search_companies(q)` from `<form action="/search" method="get"><input name="q">`; `get_company(company_id)` from `/company/00445790` links | Search page and `/company/00445790` (TESCO PLC: status Active, accounts due) both fetched cleanly |
| State Bar of California `https://apps.calbar.ca.gov/attorney/LicenseeSearch/QuickSearch?FreeText=nakashima` | `search_attorneys(FreeText)`, `advanced_search(LastName, FirstName, City, State…)` with enums; `get_licensee(licensee_id)` from `/attorney/Licensee/Detail/{n}` | GET forms with `<select>` options preserved; results table and detail page fetched |
| Wikipedia `https://en.wikipedia.org/wiki/Main_Page` | `search_wikipedia(search)` (hidden `title=Special:Search`), `get_wiki(wiki_id)` | Form with hidden input preserved |
| Hacker News `https://news.ycombinator.com/` | `get_item(id)` from `item?id=`; search delegates to `hn.algolia.com` (cross-origin, skipped by default) | Form fetched |

## Demo script (75 s)

1. 0–8 s: Home. Paste `find-and-update.company-information.service.gov.uk`, press Generate.
2. 8–20 s: Steps fill in; 5 tools, 5 verified. The page lands.
3. 20–30 s: Expand `search_companies`, Try "tesco". The result shows the source URL and timestamp.
4. 30–38 s: Copy the `claude mcp add` line and paste it into a terminal.
5. 38–62 s: In Claude Code: "Is Tesco PLC still active, and when are its next accounts due?" Show the tool calls `search_companies` → `get_company` and the answer quoting "26 August 2027" from the source.
6. 62–72 s: Back in the app, the CalBar gallery card shows `search_attorneys` with enum params. A caption reads: "read-only · robots.txt respected · free tools".
7. 72–75 s: URL and repo.

## Acceptance criteria

- [ ] `pnpm -F site-to-mcp test` passes offline. Fixtures cover: forms from Companies House, Wikipedia, CalBar, HN; templates from the Companies House links; robots parsing (Disallow blocks a template); `buildUrl` rejects cross-origin and disallowed paths; `parseJsonFromFetch`.
- [ ] Generating against Companies House yields `search_companies` and `get_company`, both `verified:true`, in under 30 s.
- [ ] `npx @modelcontextprotocol/inspector --cli https://<app>/s/companies-house/mcp --transport http --method tools/list` lists the tools with annotations. Check the exact flags with `--help`.
- [ ] `tools/call get_company {"company_id":"00445790"}` returns text that contains "TESCO PLC" and a `Source:` line.
- [ ] Claude Code connects with the snippet and completes the demo question.
- [ ] A POST form never becomes an enabled tool; a robots-disallowed path is never fetched (unit test plus a log assertion).
- [ ] Without `X-TinyFish-Key`, request 801 of the day returns the budget error; with the header the call succeeds and the key does not appear in logs.
- [ ] A request with a foreign `Origin` header gets a 403.
- [ ] Rate limits: 5 generations/hour/IP and 60 MCP calls/min/IP/slug.
- [ ] No paid TinyFish call happens anywhere in MVP code paths (grep: `agent.` and `browser.` are unused outside S2).

## Executor task list

1. Scaffold `apps/site-to-mcp` (Next.js, Tailwind preset from `@hackerson/ui`, Vitest). **Check:** `pnpm -F site-to-mcp dev` serves `/`.
2. Write `scripts/record-fixtures.ts` to save Fetch responses for the 4 demo sites (html+forms, markdown+links, robots, sitemap) into `fixtures/`. **Check:** the files exist and contain `<form`.
3. Implement `discover/robots.ts` plus tests. **Check:** tests pass.
4. Implement `discover/forms.ts` plus tests against all 4 fixtures (CalBar enums, Wikipedia hidden input, HN cross-origin skip). **Check:** tests pass.
5. Implement `discover/templates.ts` and `naming.ts` plus tests (Companies House → `get_company(company_id)`). **Check:** tests pass.
6. Implement `runtime/build-url.ts` and `runtime/execute.ts` with the injected `tf` client; unit-test the error mapping and truncation. **Check:** tests pass.
7. Implement `discover/probe.ts` and `discover/index.ts` with the `onEvent` callback; add a live script `pnpm tsx scripts/try-discover.ts <url>`. **Check:** Companies House prints ≥2 verified tools.
8. Implement `store.ts` (Upstash) and `api/generate` (SSE stream of events, final `{slug, editToken}`). **Check:** `curl -N -X POST /api/generate -d '{"url":"…"}'` streams events.
9. Implement `runtime/register.ts` and `s/[slug]/mcp/route.ts` with mcp-handler v2 (pin versions), Origin check and BYOK header. **Check:** MCP Inspector `tools/list` and `tools/call` work locally.
10. Implement `api/try` (same runtime, rate-limited). **Check:** curl returns a ToolResult.
11. Build the UI screens (Home, Generating, Site page, failure) with minimal styling. **Check:** walk through the demo locally.
12. Add rate limits and the Fetch budget counter. **Check:** the acceptance tests for limits pass, using a lowered limit in a test env.
13. Deploy to Vercel; run `scripts/seed-gallery.ts` against prod. **Check:** the 4 gallery cards load; the Inspector works against the prod URL.
14. Test with Claude Code (`claude mcp add --transport http …`) and Cursor. **Check:** the demo question is answered with tool calls.
15. Hand off to Sonnet for styling, then to DeepSeek for review.
16. Stretch S1: move `lib/runtime` into `packages/site-to-mcp-cli`, add a stdio entry using `@modelcontextprotocol/server` stdio transport and `GET /api/manifest/{slug}`. **Check:** `npx` runs and Claude Desktop lists the tools.
17. Stretch S2: `act` tool behind the owner toggle and BYOK, with `max_duration_seconds:90`, goal prefixed by "Stay on {origin}. Do not submit forms that create, buy, send or delete anything.", and a `paid` badge. **Check:** one manual run under $0.30.
18. Write the README (pitch, GIF, TinyFish usage table, safety section, setup) and record the video.
