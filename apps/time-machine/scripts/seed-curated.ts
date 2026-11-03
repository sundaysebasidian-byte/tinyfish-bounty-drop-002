import {readFileSync,writeFileSync,appendFileSync} from 'node:fs';
import {api,log} from './env.js';
const base='https://tinyfish-time-machine.sundaysebasidian.workers.dev';
const token=readFileSync('.env.runtime.local','utf8').match(/^ADMIN_TOKEN=(.+)$/m)![1];
const candidates:[string,string,string,string][]=[
 ['Wikipedia current events','https://en.wikipedia.org/wiki/Portal:Current_events','Updates','6h'],
 ['GitHub Changelog','https://github.blog/changelog/','Updates','6h'],
 ['Cloudflare Changelog','https://developers.cloudflare.com/changelog/','Updates','6h'],
 ['AWS recent announcements','https://aws.amazon.com/about-aws/whats-new/recent/','Updates','6h'],
 ['Canada immigration notices','https://www.canada.ca/en/immigration-refugees-citizenship/news/notices.html','Immigration','6h'],
 ['UK immigration rule changes','https://www.gov.uk/government/collections/immigration-rules-statement-of-changes','Immigration','6h'],
 ['US visa news','https://travel.state.gov/content/travel/en/News/visas-news.html','Immigration','6h'],
 ['OpenAI API changelog','https://developers.openai.com/api/docs/changelog','Updates','6h'],
 ['TinyFish pricing','https://www.tinyfish.ai/pricing','Pricing','daily'],
 ['Anthropic pricing','https://www.anthropic.com/pricing','Pricing','daily'],
 ['OpenAI API pricing','https://openai.com/api/pricing/','Pricing','daily'],
 ['Cloudflare Workers pricing','https://developers.cloudflare.com/workers/platform/pricing/','Pricing','daily'],
 ['Vercel pricing','https://vercel.com/pricing','Pricing','daily'],
 ['Supabase pricing','https://supabase.com/pricing','Pricing','daily'],
 ['GitHub pricing','https://github.com/pricing','Pricing','daily'],
 ['Anthropic consumer terms','https://www.anthropic.com/legal/consumer-terms','Terms & privacy','daily'],
 ['OpenAI terms of use','https://openai.com/policies/terms-of-use/','Terms & privacy','daily'],
 ['GitHub privacy statement','https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement','Terms & privacy','daily'],
 ['Cloudflare privacy policy','https://www.cloudflare.com/privacypolicy/','Terms & privacy','daily'],
 ['UK skilled worker visa fees','https://www.gov.uk/skilled-worker-visa/how-much-it-costs','Immigration','daily'],
 ['Medicare coverage','https://www.medicare.gov/coverage','Insurance','daily'],
 ['Medicare costs','https://www.medicare.gov/basics/costs/medicare-costs','Insurance','daily'],
 ['In-N-Out menu','https://www.in-n-out.com/menu','Menus','daily'],
 ['Wetherspoon food menu','https://www.jdwetherspoon.com/food/','Menus','daily'],
 ['Hetzner cloud pricing','https://www.hetzner.com/cloud/','Pricing','daily'],
 ['DigitalOcean pricing','https://www.digitalocean.com/pricing','Pricing','daily'],
 ['US visa fees','https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/fees/fees-visa-services.html','Immigration','daily'],
 ['CMS coverage database','https://www.cms.gov/medicare/coverage','Insurance','daily'],
 ['Five Guys menu','https://www.fiveguys.com/menu','Menus','daily'],
 ['Pret UK menu','https://www.pret.co.uk/en-GB/our-menu','Menus','daily'],
];
let existing=await fetch(base+'/api/pages').then(r=>r.json()) as {pages:{url:string;monitor_id:string}[]};
let live=existing.pages.filter(p=>p.monitor_id).length;
const verified:unknown[]=[];
for(const [name,url,category,schedule]of candidates){
 if(live>=24)break;if(existing.pages.some(p=>p.url===url))continue;
 console.log('Verifying',name);
 try {
  const r=await api('https://api.fetch.tinyfish.ai',{urls:[url],format:'markdown',ttl:0}) as {results:{text:string;title:string}[];errors:unknown[]};
  const text=r.results?.[0]?.text??'';
  const row={name,url,category,schedule,at:new Date().toISOString(),chars:text.length,title:r.results?.[0]?.title,errors:r.errors,preview:text.slice(0,350)};
  verified.push(row);writeFileSync('evidence/fetch-verification.json',JSON.stringify(verified,null,2));
  if(text.length<200||/^(just a moment|access denied|please enable javascript|verify you are human)/i.test(text.trim())){console.log('Rejected',name,text.length);continue;}
  const response=await fetch(base+'/api/pages',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({url,name,category,schedule}),signal:AbortSignal.timeout(180000)});
  const b=await response.json() as {error?:string;page?:{id:string;monitor_id:string;schedule:string}};
  if(!response.ok){console.log('Create failed',name,b.error);if(/budget/.test(b.error??''))break;continue;}
  live++;log('monitor_create',.005,'completed');appendFileSync('evidence/seed.jsonl',JSON.stringify({name,url,...b.page})+'\n');console.log('Live',live,name,b.page?.monitor_id,b.page?.schedule);
 }catch(e){console.log('Failed',name,String(e));}
}
console.log('Live count',live);
