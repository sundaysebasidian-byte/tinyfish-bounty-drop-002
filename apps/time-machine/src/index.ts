import { Hono } from 'hono';
import type { Env,Page,Run,Snapshot } from './types';
import { equalToken,now,sha,structuredDiff,webhookToken } from './core';
export { Coordinator } from './coordinator';
const app=new Hono<{Bindings:Env}>();
const call=(env:Env,body:unknown)=>env.COORDINATOR.get(env.COORDINATOR.idFromName('time-machine-v2')).fetch('https://coordinator/',{method:'POST',body:JSON.stringify(body)});
const date=(s:string|undefined)=>{if(!s||!Number.isFinite(Date.parse(s)))throw Error('Use an ISO date');return new Date(s).toISOString();};
app.onError((e,c)=>c.json({error:e.message},400));
app.use('/api/*',async(c,next)=>{
 c.header('X-Content-Type-Options','nosniff');c.header('Cache-Control','no-store');
 if(Number(c.req.header('content-length')??0)>1500000)return c.json({error:'Payload too large'},413);
 if(!c.req.path.startsWith('/api/hooks/')&&c.req.header('authorization')!=='Bearer '+c.env.ADMIN_TOKEN){
  const key=await sha((c.req.header('cf-connecting-ip')??'unknown')+':'+now().slice(0,16));
  const r=await c.env.DB.prepare('INSERT INTO limits VALUES (?,1) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key).first<{count:number}>();if(r!.count>90)return c.json({error:'Rate limit'},429);
 }
 await next();
});
app.get('/api/pages',async c=>c.json({pages:(await c.env.DB.prepare(`SELECT p.*, (SELECT COUNT(*) FROM checks WHERE page_id=p.id) AS check_count, (SELECT COUNT(*)-1 FROM snapshots WHERE page_id=p.id) AS change_count, (SELECT MAX(captured_at) FROM checks WHERE page_id=p.id) AS last_checked_at FROM pages p ORDER BY public,category,name`).all()).results.map(({ip_hash,...p})=>p)}));
app.post('/api/pages',async c=>{const b=await c.req.json();return call(c.env,{...b,action:'create',admin:await equalToken(c.req.header('authorization')??'','Bearer '+c.env.ADMIN_TOKEN),ip:await sha(c.req.header('cf-connecting-ip')??'unknown')});});
app.get('/api/search',async c=>{const q=c.req.query('q');if(!q||q.length>150)return c.json({error:'Provide a company name (up to 150 characters)'},400);return call(c.env,{action:'search',query:q+' official pricing terms page'});});
app.post('/api/hooks/monitor/:id',async c=>{
 const p=await c.env.DB.prepare('SELECT * FROM pages WHERE id=?').bind(c.req.param('id')).first<Page>();
 if(!p)return c.json({error:'Not found'},404);
 if(!await equalToken(c.req.query('t')??'',await webhookToken(c.env.WEBHOOK_SECRET,p.id)))return c.json({error:'Unauthorized'},401);
 const run=await c.req.json<Run>();if(run.fetch_monitor_id!==p.monitor_id)return c.json({error:'Monitor mismatch'},403);
 if(typeof run.id!=='string'||!Array.isArray(run.results)||!Array.isArray(run.errors))return c.json({error:'Invalid Monitor payload'},400);
 return call(c.env,{action:'ingest',page:p,run,source:'scheduled'});
});
app.post('/api/pages/:id/screenshots/:snapshotId/retry',async c=>{if(!await equalToken(c.req.header('authorization')??'','Bearer '+c.env.ADMIN_TOKEN))return c.json({error:'Unauthorized'},401);return call(c.env,{action:'repair',id:c.req.param('id'),snapshotId:c.req.param('snapshotId')});});
app.post('/api/pages/:id/check',async c=>{if(!await equalToken(c.req.header('authorization')??'','Bearer '+c.env.ADMIN_TOKEN))return c.json({error:'Unauthorized'},401);return call(c.env,{action:'check',id:c.req.param('id')});});
app.get('/api/pages/:id/snapshots',async c=>{
 const id=c.req.param('id');const rows=await c.env.DB.batch([c.env.DB.prepare('SELECT * FROM pages WHERE id=?').bind(id),c.env.DB.prepare('SELECT * FROM snapshots WHERE page_id=? ORDER BY captured_at,id').bind(id),c.env.DB.prepare('SELECT * FROM checks WHERE page_id=? ORDER BY captured_at').bind(id)]);
 if(!rows[0].results.length)return c.json({error:'Not found'},404);
 const {ip_hash,...page}=rows[0].results[0] as Record<string,unknown>;return c.json({page,snapshots:rows[1].results,checks:rows[2].results});
});
app.get('/api/pages/:id/as-of',async c=>{
 const at=date(c.req.query('at'));const s=await c.env.DB.prepare('SELECT * FROM snapshots WHERE page_id=? AND captured_at<=? ORDER BY captured_at DESC,id DESC LIMIT 1').bind(c.req.param('id'),at).first<Snapshot>();
 if(!s)return c.json({error:'No recorded version on or before this date. History starts at the first observed baseline.'},404);
 return c.json({at,observed_at:s.captured_at,precision:'Last observed version; changes between checks are unknown',snapshot:s,screenshot:'/api/screenshots/'+s.id,source:s.final_url});
});
app.get('/api/pages/:id/diff',async c=>{
 const id=c.req.param('id'),from=date(c.req.query('from')),to=date(c.req.query('to'));if(from>to)return c.json({error:'from must be on or before to'},400);
 const sql='SELECT * FROM snapshots WHERE page_id=? AND captured_at<=? ORDER BY captured_at DESC,id DESC LIMIT 1';
 const [a,b]=await Promise.all([c.env.DB.prepare(sql).bind(id,from).first<Snapshot>(),c.env.DB.prepare(sql).bind(id,to).first<Snapshot>()]);
 if(!a||!b)return c.json({error:'Both dates need an observed version'},404);
 return c.json({from:a.captured_at,to:b.captured_at,source:b.final_url,noise_hidden:a.noise_count+b.noise_count,...structuredDiff(a.text,b.text)});
});
app.get('/api/pages/:id/export',async c=>{const id=c.req.param('id');const data=await c.env.DB.batch([c.env.DB.prepare('SELECT id,url,name,monitor_id,schedule,created_at,status FROM pages WHERE id=?').bind(id),c.env.DB.prepare('SELECT * FROM snapshots WHERE page_id=? ORDER BY captured_at,id').bind(id),c.env.DB.prepare('SELECT * FROM checks WHERE page_id=? ORDER BY captured_at').bind(id)]);if(!data[0].results.length)return c.json({error:'Not found'},404);c.header('Content-Disposition','attachment; filename="time-machine-'+id+'.json"');return c.json({schema_version:1,exported_at:now(),page:data[0].results[0],snapshots:(data[1].results as Record<string,unknown>[]).map(s=>({...s,screenshot:c.env.PUBLIC_BASE_URL+'/api/screenshots/'+s.id})),checks:data[2].results});});
app.get('/api/screenshots/:id',async c=>{const image=await c.env.BLOBS.get('shots/'+c.req.param('id'),'arrayBuffer');if(!image)return c.json({error:'Screenshot unavailable or KV propagation pending'},404);return new Response(image,{headers:{'Content-Type':'image/jpeg','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});});
app.get('/api/changelog',async c=>c.json({changes:(await c.env.DB.prepare("SELECT s.id,s.page_id,p.name,s.captured_at,s.final_url,s.shot_status,s.run_id FROM snapshots s JOIN pages p ON p.id=s.page_id JOIN checks c ON c.run_id=s.run_id WHERE c.source='scheduled' AND s.id NOT IN (SELECT id FROM snapshots first WHERE first.page_id=s.page_id ORDER BY captured_at,id LIMIT 1) ORDER BY s.captured_at DESC LIMIT 100").all()).results}));
app.get('/api/budget',async c=>{const rows=(await c.env.DB.prepare('SELECT primitive,SUM(estimate) AS usd,COUNT(*) AS calls FROM costs GROUP BY primitive').all<{primitive:string;usd:number;calls:number}>()).results;return c.json({cap_usd:4,stop_at_usd:3.2,paid_enabled:c.env.PAID_CALLS_ENABLED==='true',costs:rows,incurred_estimate_usd:rows.filter(r=>r.primitive!=='monitor_future').reduce((s,r)=>s+r.usd,0),committed_projection_usd:rows.filter(r=>r.primitive!=='monitor_check').reduce((s,r)=>s+r.usd,0),note:'Conservative reservations; wallet billing is authoritative. Scheduled costs logged on receipt; lost webhooks may undercount. Cron independently estimates elapsed charges.'});});
app.get('/api/admin/costs',async c=>{if(!await equalToken(c.req.header('authorization')??'','Bearer '+c.env.ADMIN_TOKEN))return c.json({error:'Unauthorized'},401);return c.json({costs:(await c.env.DB.prepare('SELECT * FROM costs ORDER BY at,id').all()).results});});
app.get('/api/health',async c=>c.json({ok:true,at:now(),storage:'D1 + KV',monitor_required:true}));
export default {fetch:app.fetch,scheduled:(_event:ScheduledController,env:Env,ctx:ExecutionContext)=>{ctx.waitUntil(call(env,{action:'maintenance'}).then(async r=>{if(!r.ok)throw Error('Maintenance failed: '+await r.text());}));}};
