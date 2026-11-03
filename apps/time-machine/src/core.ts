import { diffLines, diffWordsWithSpace } from 'diff';
export const now = () => new Date().toISOString();
export async function sha(value:string|ArrayBuffer|Uint8Array):Promise<string> {
 const bytes=typeof value==='string'?new TextEncoder().encode(value):value;
 return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes as BufferSource))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
const months='(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
const dates=new RegExp('\\b(?:\\d{4}-\\d{2}-\\d{2}(?:T[\\d:.]+Z?)?|\\d{1,2} '+months+' \\d{4}|'+months+' \\d{1,2},? \\d{4}|\\d{1,2}:\\d{2}(?::\\d{2})? ?(?:AM|PM|UTC|GMT)?)\\b','gi');
export function normalize(raw:string) {
 let noise=0,dropped=0,maskedLines=0;
 const text=raw.replace(/https?:\/\/[^\s)]+/g, match=>{try{const u=new URL(match);for(const k of [...u.searchParams.keys()]) if(/^(utm_|fbclid$|gclid$)/i.test(k))u.searchParams.delete(k);return u.toString();}catch{return match;}})
 .split('\n').map(s=>s.replace(/[\t ]+/g,' ').trim()).flatMap(s=>{
 const masked=/\beffective\b/i.test(s)?s:s.replace(dates,'[date/time]');
 const drop=/^(?:last updated|updated|published|as of)\s*[: ]\s*(?:today|yesterday|tomorrow|\[date\/time\])(?:\s+(?:at\s+)?\[date\/time\])?[.!]?$/i.test(masked)||/^\d+\s+(?:seconds?|minutes?|hours?)\s+ago[.!]?$/i.test(s)||/^\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm|utc)?$/i.test(s)
  || /^(?:#{1,6} )?(?:we use cookies|cookies on |accept all cookies|reject (?:all |optional )?cookies|manage (?:your )?(?:cookie|consent)|cookie (?:settings|preferences)|consent preferences|by clicking [“"']?accept)/i.test(s)
  || /^(?:advertisement|sponsored (?:content|advertisement)|promoted content|limited.time (?:offer|deal)|save \d+% (?:today|with code)|use (?:promo )?code \S+ (?:to save|for \d+%))/i.test(s);
 if(drop){noise++;dropped++;return [];}
 // Effective dates are policy content, not page publication metadata.
 if(masked!==s){noise++;maskedLines++;}
 return [masked];
 }).join('\n').replace(/\n{3,}/g,'\n\n').trim();
 return {text,noise,dropped,maskedLines};
}
export function stalePages(pages:(PageHealth)[],at=Date.now()) {
 return pages.filter(p=>at-Date.parse(p.last_checked_at??p.created_at)>2*(p.schedule==='0 */6 * * *'?6:24)*3600000);
}
interface PageHealth {id:string;schedule:string;created_at:string;last_checked_at:string|null}
export class ValidationError extends Error {}
export function meaningfulText(raw:string) {
 const text=normalize(raw).text;
 const loading=text.split('\n').filter(s=>/^loading[. …]*$/i.test(s.trim())).length;
 return text.length>=200&&loading<3&&!/^(just a moment|access denied|please enable javascript|verify you are human)/i.test(text);
}
export function structuredDiff(a:string,b:string) {
 const parts=diffLines(a,b); const blocks: {type:'added'|'removed'|'changed';before:string;after:string;words:ReturnType<typeof diffWordsWithSpace>}[]=[];
 for(let i=0;i<parts.length;i++) {const p=parts[i];if(!p.added&&!p.removed)continue;
 let before=p.removed?p.value:'', after=p.added?p.value:'';
 if(p.removed&&parts[i+1]?.added)after=parts[++i].value;
 blocks.push({type:before&&after?'changed':before?'removed':'added',before,after,words:diffWordsWithSpace(before,after)});
 }
 return {blocks,added:parts.filter(p=>p.added).reduce((n,p)=>n+(p.count??0),0),removed:parts.filter(p=>p.removed).reduce((n,p)=>n+(p.count??0),0)};
}
export const chainRoot=(page:string)=>sha('time-machine:'+page);
export const chainLink=(prev:string,text:string,shot:string|null,at:string)=>sha([prev,text,shot??'-',at].join('\n'));
export interface ChainSnapshot {text:string;text_sha:string;chain_shot_sha:string|null;shot_sha:string|null;captured_at:string;link:string}
export async function verifyChain(page:string,rows:ChainSnapshot[]) {
 let prev=await chainRoot(page);
 for(let i=0;i<rows.length;i++){const s=rows[i];if(await sha(s.text)!==s.text_sha||await chainLink(prev,s.text_sha,s.chain_shot_sha,s.captured_at)!==s.link||(s.chain_shot_sha!==null&&s.chain_shot_sha!==s.shot_sha))return {ok:false,brokenAt:i};prev=s.link;}
 return {ok:true,count:rows.length};
}
export async function webhookToken(secret:string,page:string) {
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(page)))].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function equalToken(a:string,b:string) {return await sha(a)===await sha(b);}
export function safeUrl(value:string) {
 let u:URL;try{u=new URL(value);}catch{throw new ValidationError('Use a public HTTPS page URL');}
 if(u.protocol!=='https:'||u.username||u.password||u.port||!u.hostname.includes('.')||/^[\d.]+$/.test(u.hostname)||u.hostname.includes(':')||/(^|\.)(localhost|local|internal|test|invalid)$/.test(u.hostname))throw new ValidationError('Use a public HTTPS page URL');
 u.hash='';return u.toString();
}
export function paidAllowed(enabled:string,total:number,estimate:number,threshold=3.2) {if(enabled!=='true')throw Error('paid_disabled');if(total+estimate>threshold)throw Error('budget_stop');}
