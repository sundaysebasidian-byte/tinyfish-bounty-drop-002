import { TinyFish } from './tinyfish';
// CDP over Workers' native WebSocket avoids Node browser dependencies in the Worker.
export async function capture(tf:TinyFish,url:string):Promise<{jpg:Uint8Array;truncated:boolean}> {
 const session=await tf.request<{session_id:string;cdp_url:string}>('https://api.browser.tinyfish.ai',{url,timeout_seconds:60});
 let ws:WebSocket|undefined;
 try {
  const response=await fetch(session.cdp_url.replace(/^wss:/,'https:').replace(/^ws:/,'http:'),{headers:{Upgrade:'websocket'}});
  ws=response.webSocket??undefined;if(!ws)throw Error('CDP upgrade failed');ws.accept();
  let seq=0;
  const pending=new Map<number,{resolve:(v:Record<string,unknown>)=>void;reject:(e:Error)=>void}>();
  const inflight=new Set<string>();let lastActivity=Date.now();let sid='';
  ws.addEventListener('message',event=>{const msg=JSON.parse(String(event.data));if(msg.sessionId===sid){if(msg.method==='Network.requestWillBeSent'){inflight.add(msg.params.requestId);lastActivity=Date.now();}if(msg.method==='Network.loadingFinished'||msg.method==='Network.loadingFailed'){inflight.delete(msg.params.requestId);lastActivity=Date.now();}}const p=pending.get(msg.id);if(p){pending.delete(msg.id);if(msg.error)p.reject(Error(msg.error.message));else p.resolve(msg.result);}});
  const send=(method:string,params:Record<string,unknown>={},sessionId?:string)=>new Promise<Record<string,unknown>>((resolve,reject)=>{
   const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP command timeout'));},18000);
   pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});ws!.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));
  });
  const targets=await send('Target.getTargets');
  const target=(targets.targetInfos as {type:string;targetId:string}[]).find(t=>t.type==='page');if(!target)throw Error('No browser page');
  const attached=await send('Target.attachToTarget',{targetId:target.targetId,flatten:true});sid=String(attached.sessionId);
  await send('Network.enable',{},sid);
  await send('Page.enable',{},sid);
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false},sid);
  await send('Runtime.evaluate',{expression:'new Promise(resolve => { const ready=()=>location.href !== "about:blank" && document.readyState !== "loading"; if(ready()) return resolve(true); const timer=setInterval(()=>{if(ready()){clearInterval(timer);resolve(true);}},100); setTimeout(()=>{clearInterval(timer);resolve(false);},8000); })',awaitPromise:true},sid);
  const deadline=Date.now()+8000;
  while(Date.now()<deadline&&(inflight.size>0||Date.now()-lastActivity<500))await new Promise(resolve=>setTimeout(resolve,100));
  const metrics=await send('Page.getLayoutMetrics',{},sid);
  const truncated=Number((metrics.cssContentSize as {height:number}).height)>6000;
  const shot=await send('Page.captureScreenshot',{format:'jpeg',quality:72,captureBeyondViewport:true,clip:{x:0,y:0,width:1280,height:6000,scale:1}},sid);
  return {jpg:Uint8Array.from(atob(String(shot.data)),c=>c.charCodeAt(0)),truncated};
 } finally {
  ws?.close();
  await closeSession(tf,session.session_id);
 }
}

export async function closeSession(tf:TinyFish,id:string){
 try{await tf.request('https://api.browser.tinyfish.ai/'+id,undefined,'DELETE');}
 catch(e){if(e instanceof Error&&/^TinyFish HTTP (409|5\d\d)$/.test(e.message))await tf.request('https://api.browser.tinyfish.ai/'+id,undefined,'DELETE');else throw e;}
}
