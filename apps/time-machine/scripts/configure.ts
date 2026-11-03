import { randomBytes } from 'node:crypto';
import { existsSync,readFileSync,writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { key } from './env.js';
const existing=existsSync('.env.runtime.local')?Object.fromEntries(readFileSync('.env.runtime.local','utf8').split('\n').filter(Boolean).map(s=>{const i=s.indexOf('=');return[s.slice(0,i),s.slice(i+1)];})):{};
const config={ADMIN_TOKEN:existing.ADMIN_TOKEN??randomBytes(32).toString('hex'),WEBHOOK_SECRET:existing.WEBHOOK_SECRET??randomBytes(32).toString('hex'),TINYFISH_API_KEY:key()};
writeFileSync('.env.runtime.local',Object.entries(config).map(([k,v])=>k+'='+v).join('\n'),{mode:0o600});
for(const [name,value]of Object.entries(config)){const p=spawnSync('npx',['wrangler','secret','put',name],{input:value,encoding:'utf8'});if(p.status!==0)throw Error('Secret upload failed: '+name);console.log('Configured '+name);}
