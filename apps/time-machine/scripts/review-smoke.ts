import{readFileSync,writeFileSync}from'node:fs';
const base='https://tinyfish-time-machine.sundaysebasidian.workers.dev';
const token=readFileSync('.env.runtime.local','utf8').match(/^ADMIN_TOKEN=(.+)$/m)![1];
const get=async(path:string)=>{const r=await fetch(base+path,{headers:{Authorization:'Bearer '+token}});if(!r.ok)throw Error(path+' '+r.status);return r.json()};
const {added}=JSON.parse(readFileSync('evidence/review-monitor-delta.json','utf8'));
const checks=[];
for(const p of added){const {snapshots}=await get('/api/pages/'+p.id+'/snapshots');const at=snapshots[0].captured_at;
 const asof=await get('/api/pages/'+p.id+'/as-of?at='+encodeURIComponent(at));
 const diff=await get('/api/pages/'+p.id+'/diff?from='+encodeURIComponent(at)+'&to='+encodeURIComponent(at));
 const exported=await get('/api/pages/'+p.id+'/export');
 if(asof.snapshot.id!==snapshots[0].id||diff.blocks.length||!Number.isInteger(diff.noise_lines_dropped)||exported.snapshots.length!==1||snapshots[0].shot_status!=='ready')throw Error('Smoke failed');
 checks.push({page:p.name,asof:true,diff:true,export:true,screenshot_ready:true,truncated:snapshots[0].shot_truncated,noise_lines_dropped:diff.noise_lines_dropped,noise_lines_masked:diff.noise_lines_masked});}
const health=await get('/api/health');if(!health.ok||health.scheduled_deliveries.length!==25||health.rejected_401<1||health.rejected_403<1)throw Error('Health smoke failed');
writeFileSync('evidence/review-health.json',JSON.stringify(health,null,2));writeFileSync('evidence/review-smoke.json',JSON.stringify({at:new Date().toISOString(),checks,health_ok:health.ok,budget:await get('/api/budget')},null,2));console.log(JSON.stringify(checks));console.log('Health passed; synthetic rejection counters',health.rejected_401,health.rejected_403,'scheduled receipts',health.scheduled_deliveries.filter((p:{last_scheduled_at:string|null})=>p.last_scheduled_at).length);
