import { describe,it,expect } from 'vitest';
import {normalize,structuredDiff,sha,chainRoot,chainLink,verifyChain,webhookToken,equalToken,paidAllowed,safeUrl} from '../src/core';
describe('normalization and conservative noise filtering',()=>{
 it('normalizes whitespace and tracking links stably',()=>{const n=normalize(' A  B\n\n\n[Plans](https://example.com/pricing?utm_source=x&plan=pro)');expect(n.text).toBe('A B\n\n[Plans](https://example.com/pricing?plan=pro)');expect(normalize(n.text).text).toBe(n.text);});
 it('drops timestamp-only noise but preserves dates and prices in meaningful content',()=>{const n=normalize('Updated: today\n5 minutes ago\n10:30 UTC\nVisa fee changes on November 5: $120\nOffer ends at 10:30 UTC\n$20 per month');expect(n.noise).toBe(4);expect(n.text).toContain('Visa fee');expect(n.text).toContain('Offer ends at [date/time]');expect(n.text).toContain('$20');});
 it('preserves policy effective dates',()=>expect(normalize('Effective November 17, 2026').text).toContain('November 17'));
});
describe('structured diff',()=>{
 it('groups replacements and gives word-level changes',()=>{const d=structuredDiff('Pro $20\nFree\n','Pro $25\nFree\nExtra\n');expect(d.blocks.map(b=>b.type)).toEqual(['changed','added']);expect(d.blocks[0].before).toContain('$20');expect(d.blocks[0].after).toContain('$25');expect(d.blocks[0].words.some(w=>w.added)).toBe(true);expect(d.added).toBe(2);expect(d.removed).toBe(1);});
 it('returns no changes for identical input',()=>expect(structuredDiff('same','same').blocks).toEqual([]));
 it('represents removal',()=>expect(structuredDiff('Gone\n','').blocks[0].type).toBe('removed'));
});
describe('evidence chain',()=>{
 it('verifies a chain then detects one-byte text tampering',async()=>{const page='test',text='Price $20',at='2026-11-03T18:00:00Z',text_sha=await sha(text);const s={text,text_sha,shot_sha:null,chain_shot_sha:null,captured_at:at,link:await chainLink(await chainRoot(page),text_sha,null,at)};expect(await verifyChain(page,[s])).toEqual({ok:true,count:1});expect(await verifyChain(page,[{...s,text:'Price $21'}])).toEqual({ok:false,brokenAt:0});});
 it('binds screenshots and detects wrong page roots',async()=>{const s={text:'a',text_sha:await sha('a'),shot_sha:'abc',chain_shot_sha:'abc',captured_at:'2026-11-03',link:''};s.link=await chainLink(await chainRoot('p'),s.text_sha,s.shot_sha,s.captured_at);expect((await verifyChain('p',[s])).ok).toBe(true);expect((await verifyChain('q',[s])).ok).toBe(false);expect((await verifyChain('p',[{...s,shot_sha:'tampered'}])).ok).toBe(false);});
});
describe('webhook authentication',()=>{
 it('authenticates correct secret and page only',async()=>{const token=await webhookToken('secret','p');expect(await equalToken(token,await webhookToken('secret','p'))).toBe(true);expect(await equalToken(token,await webhookToken('wrong','p'))).toBe(false);expect(await equalToken(token,await webhookToken('secret','q'))).toBe(false);expect(await equalToken('',token)).toBe(false);});
});
describe('paid-call guard',()=>{
 it('blocks disabled payments',()=>expect(()=>paidAllowed('false',0,.004)).toThrow('paid_disabled'));
 it('blocks at 80% of $4',()=>{expect(()=>paidAllowed('true',3.199,.004)).toThrow('budget_stop');expect(()=>paidAllowed('true',3,.004)).not.toThrow();});
});
describe('public URL validation',()=>{
 it('accepts public HTTPS and strips fragment',()=>expect(safeUrl('https://example.com/pricing#plans')).toBe('https://example.com/pricing'));
 it.each(['http://example.com','https://127.0.0.1','https://localhost/','https://example.internal','https://user:pass@example.com/','https://[::1]/','https://example.com:8443/'])('rejects %s',url=>expect(()=>safeUrl(url)).toThrow());
});
it('rejects loading placeholders as meaningful content',async()=>{const {meaningfulText}=await import('../src/core');expect(meaningfulText('# AWS\nLoading\nLoading\nLoading\n'+'Intro '.repeat(50))).toBe(false);expect(meaningfulText('Published product pricing $20 per month. '.repeat(10))).toBe(true);});
