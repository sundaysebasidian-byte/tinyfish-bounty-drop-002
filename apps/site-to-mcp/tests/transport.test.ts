import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import worker from '../src/worker.js';
import { Runtime } from '../src/runtime.js';
test('stateless MCP returns JSON and completes repeated calls on one client', async () => {
  const original = Runtime.prototype.run;
  Runtime.prototype.run = async () => ({ source_url:'https://princecharlescinema.com/whats-on/', checked_at:new Date().toISOString(), modifier:'35mm', films:[], total:0, offset:0,limit:10,next_offset:null });
  const env = { DB:{prepare(){return {bind(){return this}, async first(){return {count:1}}}}} };
  const client=new Client({name:'transport-regression',version:'1'});
  const transport=new StreamableHTTPClientTransport(new URL('https://test/mcp'),{fetch:async(input,init)=>{
    const response=await worker.fetch(new Request(input,init),env as unknown as Env);
    if(response.status===200)assert.match(response.headers.get('content-type')??'',/application\/json/);
    return response;
  }});
  try { await client.connect(transport); for(let i=0;i<12;i++) {const result=await client.callTool({name:'list_by_format',arguments:{modifier:'35mm',limit:10}},undefined,{timeout:1000});assert.equal(result.isError,undefined);} }
  finally {await client.close();Runtime.prototype.run=original;}
});
