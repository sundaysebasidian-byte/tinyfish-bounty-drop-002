import { DurableObject } from 'cloudflare:workers';
import type { Env, Page, Run, Snapshot } from './types';
import { TinyFish } from './tinyfish';
import { chainLink,chainRoot,meaningfulText,normalize,now,paidAllowed,safeUrl,sha,stalePages,ValidationError,webhookToken } from './core';
import { capture } from './screenshot';
export class Coordinator extends DurableObject<Env> {
 private queue:Promise<unknown>=Promise.resolve();
 private wallet?:{balance:number;at:number};
 private serial<T>(fn:()=>Promise<T>):Promise<T>{const result=this.queue.then(fn);this.queue=result.catch(()=>{});return result;}
 private tf(){return new TinyFish(this.env);}
 private async cost(kind:string,amount:number,detail:string){await this.env.DB.prepare('INSERT INTO costs VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),now(),kind,amount,detail).run();}
 private async reserve(kind:string,amount:number,detail:string){
  const row=await this.env.DB.prepare("SELECT COALESCE(SUM(estimate),0) AS total FROM costs WHERE primitive != 'monitor_check'").first<{total:number}>();
  paidAllowed(this.env.PAID_CALLS_ENABLED,row!.total,amount,Number(this.env.STOP_AT_USD));
  if(!this.wallet||Date.now()-this.wallet.at>300000){const w=await this.tf().request<{available_balance:string}>('https://agent.tinyfish.ai/v1/wallet');const balance=Number(w.available_balance);if(!Number.isFinite(balance))throw Error('Wallet balance unavailable');this.wallet={balance,at:Date.now()};}
  if(this.wallet.balance-amount<3)throw Error('wallet_floor');
  if(kind==='browser'){const daily=await this.env.DB.prepare("SELECT COALESCE(SUM(estimate),0) AS total FROM costs WHERE primitive='browser' AND at>=?").bind(now().slice(0,10)).first<{total:number}>();if(daily!.total+amount>.15)throw Error('daily_browser_cap');}
  await this.cost(kind,amount,detail);
 }
 async fetch(request:Request):Promise<Response>{
  try {const b=await request.json() as {action:string;[key:string]:unknown};
   if(b.action==='search')return Response.json(await this.tf().search(String(b.query)));
   if(b.action==='create')return Response.json(await this.create(b));
   if(b.action==='repair'){const p=await this.page(String(b.id));if(p.status!=='active')return Response.json({error:'Page is read-only'},{status:409});const shot=await this.env.DB.prepare('SELECT * FROM snapshots WHERE id=? AND page_id=?').bind(String(b.snapshotId),p.id).first<Snapshot>();if(!shot)throw Error('Snapshot not found');if(shot.shot_status==='ready')return Response.json({existing:true});await this.takeShot(shot.id,p);return Response.json({ok:true});}
   if(b.action==='maintenance'){await this.maintenance();return Response.json({ok:true});}
   if(b.action==='check'){const p=await this.page(String(b.id));if(p.status!=='active')return Response.json({error:'Page is read-only'},{status:409});await this.serial(()=>this.reserve('monitor_manual',.005,p.id));const r=await this.tf().monitor<{run:Run}>('/'+p.monitor_id+'/runs',{},'POST');return Response.json(await this.serial(()=>this.ingest(p,r.run,'manual')));}
   return await this.serial(async()=>{
   switch(b.action){
    case 'ingest':return Response.json(await this.ingest(b.page as Page,b.run as Run,String(b.source)));
    default:return Response.json({error:'Unknown operation'},{status:400});
   }
  });}catch(e){const message=e instanceof Error?e.message:'Operation failed';return Response.json({error:message},{status:/slots|rate|budget|paid_disabled/.test(message)?429:e instanceof ValidationError||e instanceof SyntaxError?400:/not found/i.test(message)?404:500});}
 }
 private async page(id:string){const p=await this.env.DB.prepare('SELECT * FROM pages WHERE id=?').bind(id).first<Page>();if(!p)throw Error('Page not found');return p;}
 private async create(b:Record<string,unknown>){
  const url=safeUrl(String(b.url));const existing=await this.env.DB.prepare('SELECT * FROM pages WHERE url=?').bind(url).first<Page>();if(existing)return {page:existing,existing:true};
  const admin=b.admin===true;
  const verified=await this.tf().fetchPage(url);const result=verified.results?.[0];
  if(!result||!meaningfulText(result.text??''))throw new ValidationError('Fetch verification failed: page unavailable or insufficient meaningful text');
  const id=crypto.randomUUID();const created=now();const fast=admin&&b.schedule==='6h';
  const expires=admin?null:new Date(Date.now()+7*86400000).toISOString();
  const end=Math.min(new Date(this.env.MONITOR_END).getTime(),expires?new Date(expires).getTime():Infinity);
  const days=Math.max(0,Math.ceil((end-Date.now())/86400000));
  const projected=.005*(1+days+(fast?3*3:0));

  const p:Page={id,url,name:String(b.name??result.title??new URL(url).hostname).slice(0,100),category:admin?String(b.category??'Web'):'Community',monitor_id:null,schedule:fast?'0 */6 * * *':'0 9 * * *',created_at:created,expires_at:expires,public:admin?0:1,status:'creating',verified_at:created,fast_until:fast?new Date(Date.now()+3*86400000).toISOString():null};
  await this.serial(async()=>{
  if(!admin){
   const count=await this.env.DB.prepare("SELECT COUNT(*) AS n FROM pages WHERE public=1 AND status IN ('active','creating')").first<{n:number}>();if(count!.n>=3)throw Error('No public slots left');
   const limit='track:'+String(b.ip)+':'+now().slice(0,10);const hit=await this.env.DB.prepare('INSERT INTO limits VALUES (?,1) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(limit).first<{count:number}>();if(hit!.count>1)throw Error('Track rate limit: one page per day');
  }
  if(await this.env.DB.prepare('SELECT 1 FROM pages WHERE url=?').bind(url).first())throw Error('Page already being tracked');
  await this.reserve('monitor_future',projected,id);
  await this.env.DB.prepare('INSERT INTO pages (id,url,name,category,schedule,created_at,expires_at,public,status,ip_hash,verified_at,fast_until) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind(p.id,p.url,p.name,p.category,p.schedule,p.created_at,p.expires_at,p.public,p.status,String(b.ip??''),p.verified_at,p.fast_until).run();
  });
  const token=await webhookToken(this.env.WEBHOOK_SECRET,id);
  // Persist the page before provisioning so a failed create remains visible for reconciliation.
  let createdMonitor:{monitor:{id:string};run:Run};
  try{createdMonitor=await this.tf().monitor<{monitor:{id:string};run:Run}>('',{type:'fetch',name:'TM · '+p.name,config:{url,format:'markdown'},schedule_cron:p.schedule,purpose:'Record meaningful changes to prices, terms, eligibility rules or published updates.',webhook_url:this.env.PUBLIC_BASE_URL+'/api/hooks/monitor/'+id+'?t='+token});
  }catch(e){await this.env.DB.batch([this.env.DB.prepare("UPDATE pages SET status='failed' WHERE id=?").bind(id),this.env.DB.prepare("DELETE FROM costs WHERE primitive='monitor_future' AND detail=?").bind(id)]);throw e;}
  p.monitor_id=createdMonitor.monitor.id;p.status='active';
  await this.env.DB.prepare("UPDATE pages SET monitor_id=?,status='active' WHERE id=?").bind(p.monitor_id,id).run();
  const baseline=await this.serial(()=>this.ingest(p,createdMonitor.run,'baseline'));return {page:p,baseline};
 }
 private async ingest(p:Page,run:Run,source:string){
  if(await this.env.DB.prepare('SELECT 1 FROM checks WHERE run_id=?').bind(run.id).first())return {duplicate:true};
  let at=now();const previous=await this.env.DB.prepare('SELECT * FROM snapshots WHERE page_id=? ORDER BY captured_at DESC,id DESC LIMIT 1').bind(p.id).first<Snapshot>();
  if(previous&&at<=previous.captured_at)at=new Date(Date.parse(previous.captured_at)+1).toISOString();
  const result=run.results?.[0];const raw=result?.text;
  const error=typeof raw!=='string'||!raw.trim()?'Fetch failed: no text':run.errors?.length?JSON.stringify(run.errors):(!meaningfulText(raw)&&raw.length>200)?'Fetch incomplete: challenge or loading placeholder':null;
  if(error){await this.env.DB.prepare('INSERT INTO checks (run_id,page_id,captured_at,changed,source,error) VALUES (?,?,?,?,?,?)').bind(run.id,p.id,at,0,source,error).run();return {changed:false,error};}
  const normalized=normalize(raw!);const textSha=await sha(normalized.text);const changed=!previous||normalized.text!==normalize(previous.raw_text).text;
  const noiseOnly=!!previous&&!changed&&raw!==previous.raw_text;
  const statements=[this.env.DB.prepare('INSERT INTO checks (run_id,page_id,captured_at,changed,source,error,noise_only,noise_count) VALUES (?,?,?,?,?,NULL,?,?)').bind(run.id,p.id,at,changed?1:0,source,noiseOnly?1:0,normalized.noise)];
  let id:string|undefined;
  if(changed){
   id=crypto.randomUUID();const link=await chainLink(previous?.link??await chainRoot(p.id),textSha,null,at);
   statements.push(this.env.DB.prepare('INSERT INTO snapshots (id,page_id,run_id,captured_at,final_url,title,raw_text,text,text_sha,link,shot_status,noise_count) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,p.id,run.id,at,result.final_url||p.url,result.title||p.name,raw,normalized.text,textSha,link,'pending',normalized.noise));
  }
  if(source==='scheduled'||source==='baseline')statements.push(this.env.DB.prepare('INSERT INTO costs VALUES (?,?,?,?,?)').bind('run:'+run.id,at,'monitor_check',.005,p.id));
  await this.env.DB.batch(statements);
  if(id){const snapshotId=id;this.ctx.waitUntil(this.takeShot(snapshotId,p));}
  return {changed,noiseOnly,noiseLines:normalized.noise,snapshotId:id};
 }
 private async takeShot(id:string,p:Page){
  try {
   await this.serial(()=>this.reserve('browser',.004,id));
   const {jpg,truncated}=await capture(this.tf(),p.url);const shotSha=await sha(jpg);
   await this.env.BLOBS.put('shots/'+id,jpg,{metadata:{type:'image/jpeg'}});
   await this.serial(async()=>{
   const s=await this.env.DB.prepare('SELECT * FROM snapshots WHERE id=?').bind(id).first<Snapshot>();
   const newest=await this.env.DB.prepare('SELECT id FROM snapshots WHERE page_id=? ORDER BY captured_at DESC,id DESC LIMIT 1').bind(p.id).first<{id:string}>();
   const previous=await this.env.DB.prepare('SELECT link FROM snapshots WHERE page_id=? AND captured_at < ? ORDER BY captured_at DESC,id DESC LIMIT 1').bind(p.id,s!.captured_at).first<{link:string}>();
   const late=newest!.id!==id;const link=late?s!.link:await chainLink(previous?.link??await chainRoot(p.id),s!.text_sha,shotSha,s!.captured_at);
   await this.env.DB.prepare("UPDATE snapshots SET shot_sha=?,chain_shot_sha=?,link=?,shot_status='ready',shot_at=?,late=?,shot_truncated=? WHERE id=?").bind(shotSha,late?null:shotSha,link,now(),late?1:0,truncated?1:0,id).run();
   });
  }catch(e){const reason=e instanceof Error?e.message:'capture_failed';await this.env.DB.prepare('UPDATE snapshots SET shot_status=? WHERE id=?').bind(reason,id).run();}
 }
 private async maintenance(){
  const pages=(await this.env.DB.prepare("SELECT * FROM pages WHERE status='active'").all<Page>()).results;
  const health=(await this.env.DB.prepare("SELECT p.id,p.schedule,p.created_at,(SELECT MAX(captured_at) FROM checks WHERE page_id=p.id) AS last_checked_at FROM pages p WHERE status='active'").all<{id:string;schedule:string;created_at:string;last_checked_at:string|null}>()).results;
  for(const p of stalePages(health))await this.env.DB.prepare('INSERT INTO events(at,message) SELECT ?,? WHERE NOT EXISTS (SELECT 1 FROM events WHERE message=? AND at>?)').bind(now(),'stale_page:'+p.id,'stale_page:'+p.id,new Date(Date.now()-3600000).toISOString()).run();
  const costs=await this.env.DB.prepare("SELECT COALESCE(SUM(estimate),0) AS total FROM costs WHERE primitive!='monitor_future'").first<{total:number}>();
  // Reserve headroom for a full interval of checks even if every webhook is lost.
  let incurred=.004;
  for(const p of pages){const elapsed=Math.max(0,(Date.now()-Date.parse(p.created_at))/86400000);const fastDays=p.fast_until?Math.max(0,Math.min(elapsed,(Date.parse(p.fast_until)-Date.parse(p.created_at))/86400000)):0;incurred+=.005*(1+Math.ceil(elapsed)+3*Math.ceil(fastDays));}
  const browser=await this.env.DB.prepare("SELECT COALESCE(SUM(estimate),0) AS total FROM costs WHERE primitive NOT IN ('monitor_future','monitor_check')").first<{total:number}>();
  const committed=await this.env.DB.prepare("SELECT COALESCE(SUM(estimate),0) AS total FROM costs WHERE primitive!='monitor_check'").first<{total:number}>();
  const stop=committed!.total>=Number(this.env.STOP_AT_USD)||this.env.PAID_CALLS_ENABLED!=='true'||Date.now()>=Date.parse(this.env.MONITOR_END)||Math.max(costs!.total,incurred+browser!.total)+pages.length*.005>=Number(this.env.STOP_AT_USD);
  for(const p of pages){
   if(p.public&&p.expires_at&&p.expires_at<=now()){
    await this.tf().monitor('/'+p.monitor_id,undefined,'DELETE');
    try{await this.tf().monitor('/'+p.monitor_id);throw Error('Deleted Monitor remains readable');}catch(e){if(!(e instanceof Error)||e.message!=='TinyFish HTTP 404')throw e;}
    await this.env.DB.prepare("UPDATE pages SET status='expired' WHERE id=?").bind(p.id).run();
   }else if(stop&&(await this.page(p.id)).status==='active'){await this.tf().monitor('/'+p.monitor_id,{status:'paused'},'PATCH');await this.env.DB.prepare("UPDATE pages SET status='budget_paused' WHERE id=?").bind(p.id).run();}
   else if(p.fast_until&&p.fast_until<=now()&&p.schedule!=='0 9 * * *'){
    await this.tf().monitor('/'+p.monitor_id,{schedule_cron:'0 9 * * *'},'PATCH');await this.env.DB.prepare("UPDATE pages SET schedule='0 9 * * *' WHERE id=?").bind(p.id).run();
   }
  }
  if(stop)await this.env.DB.prepare('INSERT INTO events(at,message) VALUES (?,?)').bind(now(),'Monitors paused: end date, disabled payments, or 80% budget guard').run();
 }
}
