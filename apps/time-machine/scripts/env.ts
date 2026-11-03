import { existsSync,readFileSync, appendFileSync } from 'node:fs';
export function key() {
 if(process.env.TINYFISH_API_KEY)return process.env.TINYFISH_API_KEY;
 const local=existsSync('.env.local')?'.env.local':'/Users/sebasidian/.t3/projects/hackerson/.env.local';
 const env = readFileSync(local,'utf8');
 const match = env.match(/^TINYFISH_API_KEY\s*=\s*["']?([^\s"']+)/m);
 if(!match) throw Error('Missing TinyFish key');
 return match[1];
}
export function log(kind:string, estimate:number, status:string) { appendFileSync('.cost-log.jsonl', JSON.stringify({at:new Date().toISOString(),kind,estimate,status})+'\n'); }
export async function api(url:string,body?:unknown,method=body?'POST':'GET') {
 const r=await fetch(url,{method,headers:{'X-API-Key':key(),'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(150000)});
 if(!r.ok) throw Error(`TinyFish ${r.status}: ${(await r.text()).slice(0,500)}`);
 return r.status===204?null:r.json();
}
