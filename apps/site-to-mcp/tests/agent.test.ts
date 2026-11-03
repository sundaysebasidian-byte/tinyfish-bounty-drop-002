import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TinyFish } from '../src/tinyfish.js';
import { Runtime } from '../src/runtime.js';
import { LocalState } from '../src/local-state.js';
test('async endpoint starts once and polling uses exact run ID', async () => {
    const tf = new TinyFish('test');
    const urls: string[] = [];
    tf.request = async (url, body) => { urls.push(url); return body ? { run_id: 'test' } : { run_id: 'test', status: 'RUNNING', num_of_steps: null, result: null }; };
    assert.equal((await tf.agent('https://princecharlescinema.com', 'read only')).run_id, 'test');
    assert.equal((await tf.getRun('test')).status, 'RUNNING');
    assert.match(urls[0], /automation\/run-async$/);
    assert.match(urls[1], /\/runs\/test\?/);
});
test('Fetch filter pagination covers every matching film without a paid run', async () => {
    const state = new LocalState(':memory:');
    const r = new Runtime({ DB: state, TINYFISH_API_KEY: 'test', PAID_CALLS_ENABLED: 'false' });
    r.tf.page = async () => ({ url: '', final_url: '', text: readFileSync('tests/fixtures/programme-full.html', 'utf8') });
    r.tf.agent = async () => { throw Error('must not run'); };
    try {
        const all = await r.filter('35mm', 0, 300);
        assert.ok(all.total > 10);
        let ids: string[] = [];
        for (let i = 0; i < all.total; i += 10) {
            const p = await r.filter('35mm', i, 10);
            ids.push(...p.films.map(f => f.film_id));
            assert.equal(p.next_offset, i + 10 < all.total ? i + 10 : null);
        }
        assert.deepEqual(ids, all.films.map(f => f.film_id));
    }
    finally {
        state.db.close();
    }
});
test('pending run returns immediately; completion settles once and caches', async () => {
    const state = new LocalState(':memory:');
    const r = new Runtime({ DB: state, TINYFISH_API_KEY: 'test', PAID_CALLS_ENABLED: 'true' });
    r.tf.agent = async () => ({ run_id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa' });
    try {
        const p = await r.agentFilter('35mm');
        assert.equal(('status' in p ? p.status : undefined), 'PENDING');
        r.tf.getRun = async () => ({ run_id: String(p.run_id), status: 'RUNNING', num_of_steps: null, result: null });
        assert.equal(((await r.runResult(String(p.run_id))) as {
            status: string;
        }).status, 'PENDING');
        r.filter = async () => ({ source_url: 'https://princecharlescinema.com/whats-on/', checked_at: new Date().toISOString(), modifier: '35mm', films: [], total: 71, offset: 0, limit: 300, next_offset: null });
        r.tf.getRun = async () => ({ run_id: String(p.run_id), status: 'COMPLETED', num_of_steps: 8, result: { modifier: '35mm', filter_applied: true, empty_state_message: '', films: [], result_state: 'matches', interaction: 'Clicked modifier then Apply' } });
        await r.runResult(String(p.run_id));
        await r.runResult(String(p.run_id));
        assert.equal((await state.prepare('SELECT reserved_mills FROM budget').first<{
            reserved_mills: number;
        }>())?.reserved_mills, 128);
        r.tf.agent = async () => { throw Error('must use cache'); };
        assert.equal((await r.agentFilter('35mm') as {
            cached: boolean;
        }).cached, true);
    }
    finally {
        state.db.close();
    }
});
test('health never starts Agent or Search even when paid budget is exhausted', async () => {
    const state = new LocalState(':memory:');
    const r = new Runtime({ DB: state, TINYFISH_API_KEY: 'test', PAID_CALLS_ENABLED: 'false' });
    r.tf.page = async (url) => ({ url, final_url: url, text: readFileSync(url.includes('/whats-on/') ? 'tests/fixtures/programme-full.html' : 'tests/fixtures/film.html', 'utf8') });
    r.tf.agent = async () => { throw Error('paid call forbidden'); };
    r.tf.search = async () => { throw Error('Search forbidden in cron'); };
    const baseline = { status: 'COMPLETED', source_url: 'https://princecharlescinema.com/whats-on/', checked_at: '2026-11-03T00:00:00.000Z', modifier: '35mm', filter_applied: true, empty_state_message: '', films: [], interaction: 'Clicked 35mm filter Apply', result_state: 'matches', cached: false, run_id: 'test', total: 71, offset: 0, limit: 300, next_offset: null };
    try {
        await state.prepare('UPDATE budget SET reserved_mills=1600 WHERE id=1').run();
        await state.prepare('INSERT INTO cache VALUES(?,?,?)').bind('last-agent-success', JSON.stringify(baseline), 0).run();
        const h = await r.health();
        assert.equal(h.ok, true);
        assert.match(h.tools.find(t => t.tool === 'filter_programme')!.reason, /2026-11-03T00:00:00/);
        assert.equal((await state.prepare('SELECT COUNT(*) AS n FROM costs').first<{
            n: number;
        }>())?.n, 0);
    }
    finally {
        state.db.close();
    }
});
test('previous verified baseline migrates without paid admission and keeps Agent timestamp', async () => {
    const state = new LocalState(':memory:');
    const r = new Runtime({ DB: state, TINYFISH_API_KEY: 'test', PAID_CALLS_ENABLED: 'false' });
    const old = { source_url: 'https://princecharlescinema.com/whats-on/', checked_at: '2026-11-03T00:00:00.000Z', modifier: '35mm', filter_applied: true, empty_state_message: '', films: [], interaction: 'Clicked modifier then Apply', result_state: 'matches', cached: false, run_id: 'old-run' };
    r.filter = async () => ({ source_url: old.source_url, checked_at: new Date().toISOString(), modifier: '35mm', films: [], total: 71, offset: 0, limit: 300, next_offset: null });
    r.tf.agent = async () => { throw Error('must not start a new paid run'); };
    try {
        await state.prepare('INSERT INTO cache VALUES(?,?,?)').bind('filter:35mm', JSON.stringify(old), Date.now() + 10000).run();
        const result = await r.agentFilter('35mm');
        assert.equal(result.checked_at, old.checked_at);
        assert.equal(result.total, 71);
        assert.equal(result.cached, true);
        assert.ok(await state.prepare("SELECT value FROM cache WHERE key='last-agent-success'").first());
    }
    finally {
        state.db.close();
    }
});
