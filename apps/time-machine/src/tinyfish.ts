import type { Env } from './types';
export class TinyFish {
 constructor(private env:Env){}
 async request<T>(url:string,body?:unknown,method=body?'POST':'GET'):Promise<T> {
  const r=await fetch(url,{method,headers:{'X-API-Key':this.env.TINYFISH_API_KEY,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(150000)});
  if(!r.ok)throw Error(`TinyFish HTTP ${r.status}`);
  return r.status===204?undefined as T:await r.json() as T;
 }
 monitor<T>(path='',body?:unknown,method?:string){return this.request<T>('https://agent.tinyfish.ai/v1/monitors'+path,body,method);}
 async fetchPage(url:string){return this.request<{results:import('./types').Result[];errors:unknown[]}>('https://api.fetch.tinyfish.ai',{urls:[url],format:'markdown',ttl:0,purpose:'Verify a public page before recording its version history'});}
 search(query:string){return this.request<unknown>('https://api.search.tinyfish.ai?query='+encodeURIComponent(query));}
}
