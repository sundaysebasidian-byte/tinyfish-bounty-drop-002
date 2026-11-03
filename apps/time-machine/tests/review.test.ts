import {it,expect,vi}from'vitest';
import {readFileSync}from'node:fs';
import {normalize,structuredDiff,stalePages}from'../src/core';
import {closeSession}from'../src/screenshot';
import type {TinyFish}from'../src/tinyfish';
import worker from'../src/index';
import type {Env}from'../src/types';
it.each(['uk-visa','uk-health','pricing'])('filters date/banner/promo-only changes in real fetched %s text',name=>{
 const {text}=JSON.parse(readFileSync('tests/fixtures/'+name+'.json','utf8'));
 const a=text+'\nThis information was checked on 10 May 2025 at 10:30 UTC.';
 const b=text+'\nThis information was checked on May 11, 2025 at 11:45 UTC.\nWe use cookies to improve this website.\nSponsored content\nUse promo code WINTER for 20% off';
 expect(normalize(a).text).toBe(normalize(b).text);
 expect(structuredDiff(normalize(a).text,normalize(b).text).blocks).toEqual([]);
 expect(normalize(b).noise).toBeGreaterThanOrEqual(4);
 expect(normalize(text+'\nVisa fee £200').text).not.toBe(normalize(text+'\nVisa fee £250').text);
});
it('masks ISO, published and as-of timestamps within sentences',()=>{
 expect(normalize('Rates as of 2025-05-10T12:00:00Z. Published 10 May 2025. Last updated May 10, 2025.').text).toBe(normalize('Rates as of 2026-06-11T13:00:00Z. Published 11 June 2026. Last updated June 11, 2026.').text);
});
it('flags only active schedule intervals strictly beyond twice the interval',()=>{
 const at=Date.parse('2026-11-04T12:00:00Z');
 expect(stalePages([{id:'fast',schedule:'0 */6 * * *',created_at:'2026-11-03T00:00:00Z',last_checked_at:'2026-11-03T23:59:59Z'},{id:'daily',schedule:'0 9 * * *',created_at:'2026-11-02T12:00:00Z',last_checked_at:null}],at).map(p=>p.id)).toEqual(['fast']);
});
it.each([409,500,503])('retries Browser DELETE once on %s',async status=>{
 const request=vi.fn().mockRejectedValueOnce(Error('TinyFish HTTP '+status)).mockResolvedValue(undefined);
 await closeSession({request}as unknown as TinyFish,'session');expect(request).toHaveBeenCalledTimes(2);
});
it('does not retry other Browser DELETE errors',async()=>{
 const request=vi.fn().mockRejectedValue(Error('TinyFish HTTP 403'));
 await expect(closeSession({request}as unknown as TinyFish,'session')).rejects.toThrow('403');expect(request).toHaveBeenCalledTimes(1);
});
it('returns 500 for unexpected storage failures and 400 for invalid dates',async()=>{
 const env={ADMIN_TOKEN:'test',DB:{prepare(){throw Error('storage failed');}}}as unknown as Env;
 const get=(path:string)=>worker.fetch(new Request('https://test'+path,{headers:{Authorization:'Bearer test'}}),env,{}as ExecutionContext);
 expect((await get('/api/health')).status).toBe(500);expect((await get('/api/pages/p/as-of?at=invalid')).status).toBe(400);
});
it('serves screenshot GETs without any rate-limit write',async()=>{
 const prepare=vi.fn(()=>{throw Error('Unexpected DB write');});
 const env={DB:{prepare},BLOBS:{get:async()=>new Uint8Array([255,216,255]).buffer}}as unknown as Env;
 const r=await worker.fetch(new Request('https://test/api/screenshots/s'),env,{}as ExecutionContext);
 expect(r.status).toBe(200);expect(prepare).not.toHaveBeenCalled();
});
it('preserves substantive content after publication labels',()=>{
 expect(normalize('Published new fee: £250').text).toContain('£250');
});
