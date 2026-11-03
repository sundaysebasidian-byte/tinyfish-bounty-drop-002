# TinyVerify — official brief (Bounty Drop 002, transcribed from tinybounties.com)

Type: API / Agentic App · 50–200 points · Open until Tue 17 Nov · individual entries · top 3 builds approved

Is this doctor licensed? Is this contractor in good standing? Is this company still registered? Answering that means digging through licensing boards and business registries with no APIs. Build a TinyFish tool that takes a person or business, the licence or record type and the place, returns a verified record from the official source, and watches it for changes.

## Submission requirements
1. Takes a person or business name, a licence or record type, and a jurisdiction
2. Checks at least two official registries or licensing boards (any country)
3. Returns a structured record: status (active, expired, suspended), licence or registration number, expiry date, any disciplinary actions, source link and when it was checked
4. Uses TinyFish Monitor to flag when a status changes
5. Short explanation of how TinyFish Agent, Fetch and Monitor are used

## Approval criteria
1. Results come live from the official source, with a link to prove it
2. Accurate: status and numbers match the registry
3. Handles no match or several matches clearly instead of guessing
4. Works for different people, businesses and places, not a hardcoded few
5. Output is structured and reusable by other tools

## Scoring (endpoints)
1 endpoint 50 · 2 endpoints 100 · 3 endpoints 150 · 4+ endpoints 200. Endpoints must contribute meaningfully; padding usage to reach a higher tier does not qualify.

## What we're looking for
A check a hiring manager or compliance team would rely on without redoing it by hand.

## How we judge it (scored /100; weighted most)
1. Accuracy: status, numbers and dates match the official registry
2. Coverage: number of registries, record types and places it supports
3. Ambiguity: handles no match, several matches and name variants clearly
4. Monitor flags status changes reliably
5. Trust: every result shows its source and when it was checked, in a reusable format
