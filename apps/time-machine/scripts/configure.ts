import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { key } from './env.js';
const config={ADMIN_TOKEN:randomBytes(32).toString('hex'),WEBHOOK_SECRET:randomBytes(32).toString('hex'),TINYFISH_API_KEY:key()};
writeFileSync('.env.runtime.local',Object.entries(config).map(([k,v])=>k+'='+v).join('\n'),{mode:0o600});
for(const [name,value]of Object.entries(config)){const p=spawnSync('npx',['wrangler','secret','put',name],{input:value,encoding:'utf8'});if(p.status!==0)throw Error('Secret upload failed: '+name);console.log('Configured '+name);}
