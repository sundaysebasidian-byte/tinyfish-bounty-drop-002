import {api,log}from'./env.js';
import {readFileSync,writeFileSync}from'node:fs';
import {execFileSync}from'node:child_process';
const base='https://tinyfish-time-machine.sundaysebasidian.workers.dev';
const token=readFileSync('.env.runtime.local','utf8').match(/^ADMIN_TOKEN=(.+)$/m)![1];
const get=async(path:string)=>{const r=await fetch(base+path,{headers:{Authorization:'Bearer '+token}});if(!r.ok)throw Error('GET '+r.status);return r.json()};
const report:{at:string;added:unknown[];removed:unknown[];budget?:unknown}={at:new Date().toISOString(),added:[],removed:[]};
const pages=await get('/api/pages')as{pages:{id:string;name:string;monitor_id:string;status:string}[]};
const changes=[['Cloudflare Changelog','UK student visa fees','https://www.gov.uk/student-visa'],['OpenAI API changelog','UK immigration health surcharge','https://www.gov.uk/healthcare-immigration-application/how-much-pay']];
for(const [oldName,name,url]of changes){
 const old=pages.pages.find(p=>p.name===oldName&&p.status==='active');if(!old)throw Error('Missing active replacement '+oldName);
 const r=await fetch(base+'/api/pages',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({name,url,category:'Immigration',schedule:'daily'}),signal:AbortSignal.timeout(180000)});
 const data=await r.json()as{page?:{id:string;monitor_id:string};error?:string};if(!r.ok||!data.page?.monitor_id)throw Error('Create failed '+JSON.stringify(data));
 report.added.push({name,url,...data.page});log('monitor_create',.005,'review replacement '+name);
 await api('https://agent.tinyfish.ai/v1/monitors/'+old.monitor_id,undefined,'DELETE');
 try{await api('https://agent.tinyfish.ai/v1/monitors/'+old.monitor_id);throw Error('Monitor still readable');}catch(e){if(!(e instanceof Error)||!e.message.startsWith('TinyFish 404:'))throw e;}
 execFileSync('npx',['wrangler','d1','execute','tinyfish-time-machine','--remote','--command',`UPDATE pages SET status='archived' WHERE id='${old.id}' AND status='active'`],{stdio:'pipe'});
 report.removed.push({...old,deleted_verified_404:true,history:'retained read-only'});writeFileSync('evidence/review-monitor-delta.json',JSON.stringify(report,null,2));
 console.log('Replaced',oldName,'with',name);
}
report.budget=await get('/api/budget');writeFileSync('evidence/review-monitor-delta.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report.budget));
