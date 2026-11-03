# Time Machine — official brief (Bounty Drop 002, transcribed from tinybounties.com)

Type: API / Agentic App · 50–200 points · Open until Tue 17 Nov · individual entries · top 3 builds approved

Pricing pages, policies and rules change quietly, and the old version is gone for good. Build a version-history API on TinyFish Monitor: pick a set of pages that change (SaaS pricing, privacy policies and Terms of Service, visa and immigration rules, insurance coverage policies, menu prices), watch them, take a screenshot every time one changes, and let anyone ask what a page said and looked like on a given date and what changed between two dates.

## Submission requirements
1. Uses TinyFish Monitor to track at least 20 real pages that change
2. Answers "what did this page say on date X" and shows a structured diff between any two dates
3. Takes a screenshot of the page every time a change is detected and stores it, so every version can be seen as it looked
4. Shows a version timeline for each page, with every version's screenshot and source link
5. Runs live for at least 3 days before you submit, with logs of the real changes it caught
6. Short explanation of how TinyFish Monitor (and Fetch, if used) is used

## Approval criteria
1. Monitor does the core work: remove it and the build stops working
2. Diffs are structured (what was added, removed or changed), not a raw text dump
3. Works for any page you add, not a hardcoded few
4. Real changes were caught live, not simulated, with a stored screenshot for each one
5. Output is reusable by other tools (an API or JSON export)

## Scoring (endpoints)
1 endpoint 50 · 2 endpoints 100 · 3 endpoints 150 · 4+ endpoints 200. Endpoints must contribute meaningfully; padding usage to reach a higher tier does not qualify.
(Interpretation: "endpoints" most likely = distinct TinyFish primitives/endpoints used, e.g. Monitor, Fetch, Search, Browser/Agent — verify in the rulebook.)

## What we're looking for
A history of the web that nobody else has, because your build started recording it.

## How we judge it (scored /100; weighted most)
1. Monitor depth: how many pages it tracks, how often, and how cleanly each change is captured
2. Diff quality: real changes stand out, noise like dates, ads and tracking codes is ignored
3. History you can query and see: the as-of lookup and timeline give the right version, with a stored screenshot for every change
4. Value: pages someone genuinely needs a history of
5. Reusability: a clean API or export another tool can build on
