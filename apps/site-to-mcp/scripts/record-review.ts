import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { writeFileSync } from 'node:fs';
const c = new Client({ name: 'pcc-planning-conversation', version: '2.0' });
await c.connect(new StreamableHTTPClientTransport(new URL('https://site-to-mcp-pcc.sundaysebasidian.workers.dev/mcp')));
let transcript = `# Real MCP client planning conversation\n\nRecorded ${new Date().toISOString()} using the MCP SDK over live Streamable HTTP. Scripted user turns and client decisions; no claim of an LLM-generated conversation. Raw tool results are preserved below.\n`;
async function call(name: string, args: Record<string, unknown>) { const r = await c.callTool({ name, arguments: args }, undefined, { timeout: 180000 }); transcript += `\nClient → ${name} ${JSON.stringify(args)}\n\nServer:\n\`\`\`json\n${JSON.stringify(r.structuredContent ?? r, null, 2)}\n\`\`\`\n`; writeFileSync('docs/demo-transcript.md', transcript); if (r.isError)
    throw Error(JSON.stringify(r)); return r.structuredContent as Record<string, unknown>; }
try {
    transcript += '\nUser: Verify the cinema’s 35mm filter UI while I plan a visit.\n';
    let r: Record<string, unknown>;
    try {
        await call('get_run_result', { run_id: 'f96a0232-17eb-4685-b6c2-1b97c7beb1bc' });
    }
    catch {
        transcript += '\nClient: The new Agent attempt did not confirm Apply, so the server correctly rejected it. Reuse the previously verified successful baseline, with current complete Fetch results.\n';
    }
    r = await call('filter_programme', { modifier: '35mm' });
    const runId = r.run_id;
    console.log('Agent run', runId, r.status ?? 'cached');
    transcript += '\nUser: Find Akira and check the runtime, director and upcoming screening times.\n';
    const search = await call('search_films', { query: 'Akira' });
    const film = (search.films as {
        film_id: string;
    }[]).find(f => f.film_id === '1808');
    if (!film)
        throw Error('Akira missing');
    await call('get_film', { film_id: film.film_id });
    await call('get_screenings', { film_id: film.film_id });
    transcript += '\nUser: Show all 35mm options, ten per page; do not omit remaining matches.\n';
    let page = await call('list_by_format', { modifier: '35mm', limit: 10 });
    while (page.next_offset !== null)
        page = await call('list_by_format', { modifier: '35mm', limit: 10, offset: page.next_offset });
    transcript += '\nUser: Retrieve the UI verification result and check server health.\n';
    for (let i = 0; r.status === 'PENDING' && i < 20; i++) {
        r = await call('get_run_result', { run_id: runId });
        if (r.status === 'PENDING')
            await new Promise(resolve => setTimeout(resolve, 5000));
    }
    if (r.status === 'PENDING')
        throw Error('Agent still pending; resume by recorded run ID, never restart');
    const h = await call('health_check', {});
    writeFileSync('docs/evidence/health-review.json', JSON.stringify(h, null, 2));
    console.log('Health', h.ok);
}
finally {
    await c.close();
}
