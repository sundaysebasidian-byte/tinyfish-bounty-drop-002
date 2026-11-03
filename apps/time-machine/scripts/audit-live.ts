import {api,log} from './env.js';
import {readFileSync,writeFileSync}from'node:fs';
import {webhookToken,verifyChain}from'../src/core.js';
import type {Snapshot,Page}from'../src/types.js';
const config=Object.fromEntries(readFileSync('.env.runtime.local','utf8').split('\n').filter(Boolean).map(s=>{const i=s.indexOf('=');return[s.slice(0,i),s.slice(i+1)];}));
const base='https://tinyfish-time-machine.sundaysebasidian.workers.dev';
const get=async<T=unknown>(path:string):Promise<T>=>{const r=await fetch(base+path);if(!r.ok)throw Error(path+' HTTP '+r.status);return r.json() as Promise<T>;};
const pages=await get<{pages:Page[]}>('/api/pages');
const monitors=await api('https://agent.tinyfish.ai/v1/monitors')as{monitors:{id:string;name:string;status:string;schedule_cron:string}[]};
const report:{at:string;pages:unknown[];monitors:unknown[];checks:unknown[];budget?:unknown;wallet?:unknown}={at:new Date().toISOString(),pages:pages.pages,monitors:monitors.monitors.filter(m=>pages.pages.some((p:Page)=>p.monitor_id===m.id)).map(({id,name,status,schedule_cron})=>({id,name,status,schedule_cron})),checks:[]};
for(const p of pages.pages){
 const data=await get<{snapshots:Snapshot[]}>('/api/pages/'+p.id+'/snapshots');const snapshots=data.snapshots as Snapshot[];
 const chain=await verifyChain(p.id,snapshots);
 const images=[];
 for(const s of snapshots){if(s.shot_status==='ready'){const r=await fetch(base+'/api/screenshots/'+s.id);const bytes=new Uint8Array(await r.arrayBuffer());const {sha}=await import('../src/core.js');images.push({id:s.id,status:r.status,bytes:bytes.length,hash_ok:await sha(bytes)===s.shot_sha});}}
 if(snapshots[0]){const asof=await get<{snapshot:Snapshot}>('/api/pages/'+p.id+'/as-of?at='+encodeURIComponent(snapshots[0].captured_at));if(asof.snapshot.id!==snapshots[0].id)throw Error('As-of wrong version');const d=await get<{blocks:unknown[]}>('/api/pages/'+p.id+'/diff?from='+encodeURIComponent(snapshots[0].captured_at)+'&to='+encodeURIComponent(snapshots.at(-1)!.captured_at));if(!Array.isArray(d.blocks))throw Error('Diff shape');const e=await get<{snapshots:Snapshot[]}>('/api/pages/'+p.id+'/export');if(e.snapshots.length!==snapshots.length)throw Error('Export mismatch');}
 report.checks.push({page:p.name,snapshots:snapshots.length,chain,images,statuses:snapshots.map(s=>s.shot_status)});
 console.log(p.name,snapshots.length,chain.ok,images.length+'/'+snapshots.length,'screenshots');
}
const p=pages.pages.find((p:{name:string})=>p.name==='GitHub Changelog');
if(p){const data=await get<{snapshots:Snapshot[]}>('/api/pages/'+p.id+'/snapshots');const payload={id:data.snapshots[0].run_id,fetch_monitor_id:p.monitor_id,results:[],errors:[]};
 const token=await webhookToken(config.WEBHOOK_SECRET,p.id);
 for(const [name,t,monitor,expected]of [['wrong token','wrong',p.monitor_id,401],['wrong monitor',token,'wrong',403],['duplicate',token,p.monitor_id,200]]as const){const start=Date.now();const r=await fetch(base+'/api/hooks/monitor/'+p.id+'?t='+t,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,fetch_monitor_id:monitor})});report.checks.push({name,status:r.status,expected,ms:Date.now()-start,body:await r.json()});if(r.status!==expected)throw Error('Webhook auth smoke failed');}}
report.budget=await get('/api/budget');report.wallet=await api('https://agent.tinyfish.ai/v1/wallet');
writeFileSync('evidence/live-audit.json',JSON.stringify(report,null,2));
const costs=await fetch(base+'/api/admin/costs',{headers:{Authorization:'Bearer '+config.ADMIN_TOKEN}}).then(r=>r.json())as{costs:unknown[]};
if(costs.costs)writeFileSync('.cost-log.production.jsonl',costs.costs.map(s=>JSON.stringify(s)).join('\n')+'\n');
console.log('Verified monitors',report.monitors.length,JSON.stringify(report.budget));
