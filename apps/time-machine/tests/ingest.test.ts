import {it,expect,vi} from 'vitest';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {Coordinator} from '../src/coordinator';
import type {Env,Page} from '../src/types';
import {verifyChain} from '../src/core';
vi.mock('../src/screenshot',()=>({capture:vi.fn(()=>{throw Error('No paid calls in tests');})}));
function fixture(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync('schema.sql','utf8'));
 const db={prepare(sql:string){const stmt=sqlite.prepare(sql);let values:unknown[]=[];const result={bind(...v:unknown[]){values=v;return result;},async first(){return stmt.get(...values as never[])??null;},async all(){return {results:stmt.all(...values as never[])};},async run(){return stmt.run(...values as never[]);}};return result;},async batch(statements:{run:()=>Promise<unknown>}[]){sqlite.exec('BEGIN');try{const rows=[];for(const s of statements)rows.push(await s.run());sqlite.exec('COMMIT');return rows;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
 const tasks:Promise<unknown>[]=[];const env={DB:db,PAID_CALLS_ENABLED:'false',STOP_AT_USD:'3.20'} as unknown as Env;
 const ctx={waitUntil(p:Promise<unknown>){tasks.push(p);}} as DurableObjectState;
 const coordinator=new Coordinator(ctx,env);
 const page={id:'p',url:'https://example.com',name:'Plans',monitor_id:'m',schedule:'0 9 * * *',category:'Pricing',created_at:new Date().toISOString(),public:0,status:'active',expires_at:null,verified_at:new Date().toISOString(),fast_until:null} satisfies Page;
 sqlite.prepare('INSERT INTO pages(id,url,name,category,monitor_id,schedule,created_at) VALUES (?,?,?,?,?,?,?)').run(page.id,page.url,page.name,page.category,page.monitor_id,page.schedule,page.created_at);
 const ingest=(runId:string,text:string)=>coordinator.fetch(new Request('https://test/',{method:'POST',body:JSON.stringify({action:'ingest',page,run:{id:runId,results:[{text,title:'Plans',final_url:page.url}],errors:[]},source:'scheduled'})})).then(r=>r.json());
 return {sqlite,tasks,ingest};
}
it('stores a single check and snapshot on duplicate delivery, and marks disabled screenshot honestly',async()=>{
 const f=fixture();expect(await f.ingest('r1','Pro $20')).toMatchObject({changed:true});await Promise.all(f.tasks);expect(await f.ingest('r1','Pro $20')).toEqual({duplicate:true});expect(f.sqlite.prepare('SELECT COUNT(*) AS n FROM checks').get()).toMatchObject({n:1});expect(f.sqlite.prepare('SELECT shot_status FROM snapshots').get()).toMatchObject({shot_status:'paid_disabled'});
});
it('records unchanged checks without creating snapshots',async()=>{const f=fixture();await f.ingest('r1','Pro $20\nUpdated: today');await Promise.all(f.tasks);expect(await f.ingest('r2','Pro $20\nUpdated: tomorrow')).toMatchObject({changed:false});expect(f.sqlite.prepare('SELECT COUNT(*) AS n FROM checks').get()).toMatchObject({n:2});expect(f.sqlite.prepare('SELECT COUNT(*) AS n FROM snapshots').get()).toMatchObject({n:1});});
it('captures real text changes and preserves hash chain',async()=>{const f=fixture();await f.ingest('r1','Pro $20');await Promise.all(f.tasks);await f.ingest('r2','Pro $25');await Promise.all(f.tasks);const rows=f.sqlite.prepare('SELECT * FROM snapshots ORDER BY captured_at,id').all();expect(rows.length).toBe(2);expect(await verifyChain('p',rows as never)).toMatchObject({ok:true,count:2});});
it('records source failures without inventing a version',async()=>{const f=fixture();expect(await f.ingest('r1','')).toMatchObject({changed:false,error:'Fetch failed: no text'});expect(f.sqlite.prepare('SELECT COUNT(*) AS n FROM snapshots').get()).toMatchObject({n:0});});
it('enforces the amended three-slot public cap before provisioning a paid Monitor',async()=>{
 const f=fixture();for(let i=0;i<3;i++)f.sqlite.prepare("INSERT INTO pages(id,url,name,category,schedule,created_at,public,status) VALUES (?,?,?,?,?,?,1,'active')").run('public'+i,'https://example'+i+'.com','Public','Community','0 9 * * *',new Date().toISOString());
 const fetchMock=vi.fn(async()=>Response.json({results:[{title:'Pricing',text:'Public subscription pricing is $20 per month. '.repeat(10)}],errors:[]}));vi.stubGlobal('fetch',fetchMock);
 try{const db={prepare(sql:string){const statement=f.sqlite.prepare(sql);let values:unknown[]=[];const p={bind(...v:unknown[]){values=v;return p;},async first(){return statement.get(...values as never[])??null;}};return p;}};
 const coordinator=new Coordinator({waitUntil(){}} as unknown as DurableObjectState,{DB:db,PAID_CALLS_ENABLED:'true'} as unknown as Env);
 const response=await coordinator.fetch(new Request('https://test/',{method:'POST',body:JSON.stringify({action:'create',url:'https://new.example.com',admin:false,ip:'test'})}));expect(response.status).toBe(429);expect(await response.json()).toEqual({error:'No public slots left'});expect(fetchMock).toHaveBeenCalledTimes(1);
 }finally{vi.unstubAllGlobals();}
});
it('expires only the public Monitor, confirms deletion with 404 and keeps stored history',async()=>{
 const f=fixture();await f.ingest('baseline','Price $20');await Promise.all(f.tasks);f.sqlite.prepare("UPDATE pages SET public=1,status='active',expires_at='2026-01-01T00:00:00Z' WHERE id='p'").run();
 const requests:string[]=[];vi.stubGlobal('fetch',vi.fn(async(_url:string,options:RequestInit)=>{requests.push(options.method??'GET');return options.method==='DELETE'?new Response(null,{status:204}):new Response('{}',{status:404});}));
 try{const db={prepare(sql:string){const stmt=f.sqlite.prepare(sql);let values:unknown[]=[];const p={bind(...v:unknown[]){values=v;return p;},async first(){return stmt.get(...values as never[])??null;},async all(){return {results:stmt.all(...values as never[])};},async run(){return stmt.run(...values as never[]);}};return p;}};
 const coordinator=new Coordinator({waitUntil(){}} as unknown as DurableObjectState,{DB:db,PAID_CALLS_ENABLED:'true',STOP_AT_USD:'3.20',MONITOR_END:'2026-11-18T07:59:00Z',TINYFISH_API_KEY:'test'} as unknown as Env);
 const response=await coordinator.fetch(new Request('https://test/',{method:'POST',body:JSON.stringify({action:'maintenance'})}));expect(response.status).toBe(200);expect(requests).toEqual(['DELETE','GET']);expect(f.sqlite.prepare("SELECT status FROM pages WHERE id='p'").get()).toMatchObject({status:'expired'});expect(f.sqlite.prepare('SELECT COUNT(*) AS n FROM snapshots').get()).toMatchObject({n:1});
 }finally{vi.unstubAllGlobals();}
});
