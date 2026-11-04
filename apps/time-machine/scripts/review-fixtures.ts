import {api} from './env.js';
import {mkdirSync,writeFileSync}from'node:fs';
mkdirSync('tests/fixtures',{recursive:true});
const candidates=[['uk-visa','https://www.gov.uk/student-visa'],['uk-health','https://www.gov.uk/healthcare-immigration-application/how-much-pay'],['pricing','https://developers.cloudflare.com/workers/platform/pricing/']];
for(const [name,url]of candidates){const r=await api('https://api.fetch.tinyfish.ai',{urls:[url],format:'markdown',ttl:0}) as {results:{text:string;title:string}[];errors:unknown[]};const text=r.results?.[0]?.text??'';if(text.length<200||r.errors?.length)throw Error('Invalid fetch '+name);writeFileSync('tests/fixtures/'+name+'.json',JSON.stringify({url,fetched_at:new Date().toISOString(),...r.results[0]},null,2));console.log(name,text.length);}
console.log(await fetch('https://tinyfish-time-machine.sundaysebasidian.workers.dev/api/budget').then(r=>r.json()));
