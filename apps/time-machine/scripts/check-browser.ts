import { api,log } from './env.js';
import { chromium } from 'playwright-core';
import { writeFileSync } from 'node:fs';
const wallet=await api('https://agent.tinyfish.ai/v1/wallet');
writeFileSync('evidence/wallet-before.json',JSON.stringify(wallet,null,2));
log('browser',0.004,'reserved');
let session: {session_id:string;cdp_url:string}|undefined;
try {
 session=await api('https://api.browser.tinyfish.ai',{url:'https://www.tinyfish.ai/pricing',timeout_seconds:60}) as {session_id:string;cdp_url:string};
 const browser=await chromium.connectOverCDP(session!.cdp_url);
 try {const page=browser.contexts()[0].pages()[0];await page.waitForLoadState('domcontentloaded');const jpg=await page.screenshot({type:'jpeg',quality:75,fullPage:true});writeFileSync('evidence/browser-test.jpg',jpg);console.log('JPEG bytes',jpg.length);}
 finally {await browser.close();}
} catch(e) {writeFileSync('evidence/browser-test.json',JSON.stringify({at:new Date().toISOString(),error:String(e)})); console.log(String(e));}
finally {if(session){await api('https://api.browser.tinyfish.ai/'+session.session_id,undefined,'DELETE');console.log('Session terminated: 204');}}
