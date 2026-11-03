# Site to MCP — official brief (Bounty Drop 002, transcribed from tinybounties.com)

Type: MCP Server / API · 50–200 points · Open until Tue 17 Nov · individual entries · top 3 builds approved

Most of the web has no API, so agents can't use it. Build a tool that turns a website with no API into a permanent agent tool: an MCP server with clear, typed inputs and outputs, with TinyFish doing the reading and clicking underneath. A university course catalogue becomes search_courses(), a city events calendar becomes list_events(), a sports club booking site becomes check_court_availability().

## Submission requirements
1. Wraps at least one real website that has no public API
2. Exposes at least three tools (actions) with typed inputs and outputs
3. Works from Claude, ChatGPT or any MCP client: show it being called in a real conversation
4. Includes a test or health check that shows when the site changes and a tool breaks
5. Short explanation of how TinyFish Agent and Fetch are used

## Approval criteria
1. TinyFish does the real web work behind every tool
2. Tools return clean structured data, not raw page dumps
3. Works for different inputs, not one scripted call
4. Breaks loudly, not silently, when the site changes
5. Not licence checks or property records (those are their own bounties)

## Scoring (endpoints)
1 endpoint 50 · 2 endpoints 100 · 3 endpoints 150 · 4+ endpoints 200. Endpoints must contribute meaningfully; padding usage to reach a higher tier does not qualify.

## What we're looking for
A tool another developer would install and call from their own agent tomorrow.

## How we judge it (scored /100; weighted most)
1. Tool design: clear names, typed inputs and outputs, and actions an agent actually needs
2. Works in a real agent conversation, including multi-step use of several tools
3. Robustness: errors are clear, and a health check catches when the site changes
4. Value: a useful site with no API that people would want their agent to use
5. Easy to install and call for another developer, with a clear README
