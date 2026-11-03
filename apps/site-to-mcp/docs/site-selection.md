# Selection evidence — 2026-11-03

A single TinyFish Fetch batch requested HTML + links for:

- https://princecharlescinema.com/ — success, 1,972 characters after automatic extraction, same-origin `/film/{id}/{slug}` and `/whats-on/` links.
- https://genesiscinema.co.uk/ — success, 110,960 characters, `/event/{id}` and programme links.
- https://www.regentstreetcinema.com/ — `empty_content`.
- https://whatson.bfi.org.uk/ — `bot_blocked`.

Follow-up Fetch with `include_selectors:["body"]` on PCC preserved CSS classes and anchors. Programme returned 771,430 characters, Akira 74,868, FAQ 195,925. Known `film_id=1808` has real `date-row`, `film_book_button`, `.time` and `.tag` elements. These are recorded as minimal relevant fragments in tests/fixtures.

The booking page `/prince-charles-cinema/booknow/31627780` exposes a `#jacro_iframe` with no static `src` in Fetch HTML. Generic 2026 price bands elsewhere in the document are not performance-specific ticket quotes and are intentionally not extracted. The robots file disallows this booking path, so this initially considered tool was rejected before any paid call. The delivered Agent tool instead applies the permitted `/whats-on/` JavaScript modifier filter using actual UI controls. No undocumented booking API is called by this application.

Official-domain searches for each site's public API documentation found no PCC, Genesis or Regent Street programme/ticket API docs. BFI search surfaced unrelated video playback APIs, and its programme failed Fetch. Absence of public docs is the scope of this finding; internal supplier APIs are not public APIs. The PCC FAQ and navigation were also inspected. PCC's generic WordPress CMS endpoints do not replace a programme/interactive ticket interface.

Raw responses are preserved locally in ignored `docs/evidence/probe-*.json`; the candidate batch is preserved locally in `/tmp/site-mcp-candidates.json` and summarized here. These are discovery evidence, not runtime fixtures or hardcoded answers.
