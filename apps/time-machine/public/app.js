const root = document.querySelector('#app');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const FAST = '0 */6 * * *';
const fmt = {
  day: s => new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
  long: s => new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }),
  short: s => new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
  time: s => new Date(s).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
};
const stamp = s => `${fmt.day(s)}, ${fmt.time(s)}`;
const cadence = p => (p.schedule === FAST ? 'Every 6 hours' : 'Daily');
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const api = async (path, options) => {
  const r = await fetch(path, options);
  const b = await r.json().catch(() => ({}));
  if (!r.ok) throw Error(b.error ?? 'Request failed');
  return b;
};
const hash = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256', typeof value === 'string' ? new TextEncoder().encode(value) : value))].map(x => x.toString(16).padStart(2, '0')).join('');
const link = (prev, s) => hash([prev, s.text_sha, s.chain_shot_sha ?? '-', s.captured_at].join('\n'));
const safeSource = url => { try { const u = new URL(url); return ['https:', 'http:'].includes(u.protocol) ? esc(u.href) : '#'; } catch { return '#'; } };
const host = url => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ───────── home ───────── */

const ORDER = ['Pricing', 'Terms & privacy', 'Immigration', 'Insurance', 'Menus', 'Updates'];

function row(p) {
  const changes = Math.max(0, p.change_count);
  return `<a class="row" href="/p/${esc(p.id)}"><span><span class="name">${esc(p.name)}</span><small>${esc(host(p.url))} · ${cadence(p).toLowerCase()}</small></span>
    <span class="stat"><b>${plural(p.check_count, 'check')}</b> · <span class="${changes ? 'hot' : ''}">${plural(changes, 'change')}</span></span>
    <span class="when">${p.last_checked_at ? stamp(p.last_checked_at) : 'Awaiting baseline'}</span></a>`;
}

async function home() {
  document.title = 'Time Machine — recorded web history';
  const [{ pages }, log] = await Promise.all([api('/api/pages'), api('/api/changelog').catch(() => ({ changes: [] }))]);
  const live = pages.filter(p => p.status === 'active');
  const retired = pages.filter(p => p.status !== 'active');
  const slots = 3 - pages.filter(p => p.public && p.status === 'active').length;
  const cats = [...new Set(live.map(p => p.category))].sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));
  root.innerHTML = `
  <section class="hero">
    <h1 class="display">The web changes.<br>Your evidence stays.</h1>
    <p class="lede">Pricing, policies and rules, recorded with screenshots and verifiable history.</p>
    <form class="track" id="track"><label class="sr" for="url">Page URL</label><input id="url" type="url" placeholder="https://example.com/pricing" required autocomplete="off"><button class="btn primary">Track page</button></form>
    <small class="hint">${slots} of 3 community slots open · daily checks · 7-day expiry · subject to the shared budget</small>
    <p class="status" id="status" role="status"></p>
    <details class="find"><summary>Find a company’s pricing or terms page</summary>
      <form id="search"><label class="sr" for="company">Company name</label><input id="company" name="company" placeholder="Company name" required autocomplete="off"><button class="btn">Find pages</button></form>
      <div class="results" id="results" role="status"></div></details>
  </section>
  <div class="section-head"><h2 class="title">Recorded pages</h2><span class="count">${live.length} live</span></div>
  ${cats.map(c => `<section class="group"><h3>${esc(c)}</h3>${live.filter(p => p.category === c).map(row).join('')}</section>`).join('')}
  ${retired.length ? `<details class="retired"><summary>Retired · ${retired.length}</summary>${retired.map(row).join('')}</details>` : ''}
  <div class="section-head" id="changes"><h2 class="title">Caught live</h2></div>
  ${log.changes.length
    ? `<ul class="rail">${log.changes.map(c => `<li><time datetime="${esc(c.captured_at)}">${stamp(c.captured_at)}</time><a href="/p/${esc(c.page_id)}?s=${esc(c.id)}">${esc(c.name)}</a></li>`).join('')}</ul>`
    : `<div class="rail"><p class="rail-empty">Monitors are recording. Real scheduled changes will appear here as they arrive.</p></div>`}`;

  $('#track').onsubmit = async e => {
    e.preventDefault();
    const button = $('button', e.target), status = $('#status');
    button.disabled = true; status.className = 'status'; status.textContent = 'Fetch-verifying the page and creating its Monitor…';
    try {
      const b = await api('/api/pages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: $('#url').value }) });
      location.href = '/p/' + b.page.id;
    } catch (err) { status.textContent = err.message; status.className = 'status error'; button.disabled = false; }
  };
  $('#search').onsubmit = async e => {
    e.preventDefault();
    const results = $('#results'); results.textContent = 'Searching live sources…';
    try {
      const b = await api('/api/search?q=' + encodeURIComponent(new FormData(e.target).get('company')));
      const rows = b.results ?? b.organic ?? b.organic_results ?? [];
      results.innerHTML = rows.length ? rows.map(r => { const u = safeSource(r.url ?? r.link); return `<button type="button" class="result" data-url="${u}"><strong>${esc(r.title)}</strong><small>${esc(host(u))}</small></button>`; }).join('') : 'No matching pages returned. Try a different company.';
    } catch (err) { results.textContent = err.message; }
  };
  $('#results').onclick = e => {
    const b = e.target.closest('.result'); if (!b || b.dataset.url === '#') return;
    $('#url').value = b.dataset.url; $('#url').focus(); $('#url').scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
  };
}

/* ───────── timeline ───────── */

const STATUS_TEXT = { pending: 'Capturing screenshot…' };
const contextFor = (text, needle) => {
  needle = (needle || '').split('\n').find(l => l.trim())?.trim();
  if (!text || !needle) return '';
  const at = text.indexOf(needle); if (at <= 0) return '';
  const paras = text.slice(0, at).split(/\n\s*\n/);
  const own = (paras.pop() ?? '').split('\n').map(l => l.trim()).filter(Boolean).slice(-2);
  const out = own.length ? own : [(paras.pop() ?? '').split('\n').map(l => l.trim()).filter(Boolean).pop() ?? ''];
  const s = out.join(' · ').replace(/^#+\s*/, '');
  return s.length && s.length < 90 ? s : '';
};

const renderWords = (words, skip) => {
  const last = words.length - 1;
  return words.map((w, k) => ({ ...w, value: k === last ? w.value.replace(/\n+$/, '') : w.value })).filter(w => !w[skip])
    .map(w => w.added ? `<ins>${esc(w.value)}</ins>` : w.removed ? `<del>${esc(w.value)}</del>` : esc(w.value)).join('');
};
/* Inline word diff; heavily rewritten sentences read better as a before / after pair. */
const blockBody = x => {
  if (x.type !== 'changed') return renderWords(x.words, '');
  const total = x.words.reduce((n, w) => n + w.value.length, 0) || 1;
  const kept = x.words.filter(w => !w.added && !w.removed).reduce((n, w) => n + w.value.length, 0);
  const runs = x.words.filter((w, k) => (w.added || w.removed) && !(x.words[k - 1]?.added || x.words[k - 1]?.removed)).length;
  if (kept / total >= 0.5 && runs < 4) return renderWords(x.words, '');
  return `<span class="pair">${renderWords(x.words, 'added')}</span><span class="pair">${renderWords(x.words, 'removed')}</span>`;
};

async function timeline(id) {
  const data = await api(`/api/pages/${id}/snapshots`);
  const { page, snapshots: snaps, checks } = data;
  document.title = `${page.name} — Time Machine`;
  const wanted = new URLSearchParams(location.search).get('s');
  let idx = snaps.length - 1, other = null, mode = 'shot', split = 50, lightbox = false;
  const found = snaps.findIndex(s => s.id === wanted); if (found >= 0) idx = found;
  const diffCache = new Map();

  root.innerHTML = `
  <a class="back" href="/">← All pages</a>
  <div class="phead">
    <div><h1 class="page">${esc(page.name)}${page.status !== 'active' ? `<span class="pill">${esc(page.status)}</span>` : ''}</h1>
      <p class="src"><a href="${safeSource(page.url)}" target="_blank" rel="noopener">${esc(page.url)}</a></p>
      <p class="pmeta">${plural(checks.length, 'check')} · ${plural(Math.max(0, snaps.length - 1), 'change')} · ${cadence(page).toLowerCase()}</p></div>
    <div class="tools"><a class="btn sm" href="/api/pages/${esc(id)}/export">Export JSON</a><button class="btn sm" id="verify">Verify evidence</button><span id="verified" role="status"></span></div>
  </div>
  <section class="scrub" aria-labelledby="scrub-h">
    <div class="scrub-head"><h2 id="scrub-h">${plural(snaps.length, 'version')}</h2>
      <form class="asof" id="asof"><label for="at">As of</label><input id="at" type="datetime-local" required><button class="btn sm">Find version</button></form></div>
    <p class="asof-msg" id="asof-status" role="status"></p>
    <div class="ticks" id="ticks" role="group" aria-label="Recorded versions">${snaps.map((s, i) => `<button type="button" class="tick" data-i="${i}" aria-label="Version ${i + 1} of ${snaps.length}, ${esc(stamp(s.captured_at))}"><span class="stem"><i></i></span><span class="d">${fmt.short(s.captured_at)}<span>${fmt.time(s.captured_at)}</span></span></button>`).join('')}</div>
  </section>
  <div id="version"></div>
  <dialog class="lightbox" id="lb" aria-label="Screenshot viewer"><div class="lb-body" id="lb-body"></div></dialog>`;

  const versionEl = $('#version');
  if (!snaps.length) { versionEl.innerHTML = '<p class="empty">Waiting for a successful Monitor baseline.</p>'; $('#ticks').hidden = true; $('#asof').hidden = true; $('#verify').hidden = true; return; }
  versionEl.innerHTML = `
  <div class="vhead"><div><div class="vdate" id="vdate"></div><p class="vsub" id="vsub"></p></div>
    <div class="stepper"><button class="btn sm" id="prev" aria-label="Previous version">←</button><span class="pos" id="pos"></span><button class="btn sm" id="next" aria-label="Next version">→</button></div></div>
  <div class="stage" id="stage"></div>
  <section class="changes" aria-labelledby="ch-h">
    <div class="changes-head"><h2 class="title" id="ch-h"></h2><label class="cmp" id="cmp-wrap">Compare with <select id="cmp"></select></label></div>
    <div class="summary" id="summary"></div><p class="noise" id="noise"></p><div id="diff"></div>
  </section>
  <details class="fold"><summary>Full recorded text</summary><pre id="fulltext"></pre></details>
  <dl class="evidence" id="evidence"></dl>`;

  const baseIdx = () => (other !== null && other < idx ? other : idx - 1);
  const shotHTML = (x, cls = '', label = '') => {
    if (x?.shot_status === 'ready') return `<div class="frame ${cls}" tabindex="0" role="region" aria-label="${esc(label || 'Screenshot')}, scrollable"><img src="/api/screenshots/${esc(x.id)}" alt="Screenshot of ${esc(page.name)} captured ${esc(x.shot_at)}" decoding="async" ${cls.includes('lazy') ? 'loading="lazy"' : ''}></div>`;
    return `<div class="frame none ${cls}">No screenshot · ${esc(STATUS_TEXT[x?.shot_status] ?? x?.shot_status ?? 'No previous version')}</div>`;
  };
  function viewerHTML(large) {
    const s = snaps[idx], b = snaps[baseIdx()];
    const both = b?.shot_status === 'ready' && s.shot_status === 'ready';
    if (!both && mode !== 'shot') mode = 'shot';
    const bar = `<div class="stage-bar"><div class="seg" role="group" aria-label="View">
      <button type="button" data-mode="shot" aria-pressed="${mode === 'shot'}">Screenshot</button>
      ${b ? `<button type="button" data-mode="side" aria-pressed="${mode === 'side'}" ${both ? '' : 'disabled'}>Side by side</button><button type="button" data-mode="overlay" aria-pressed="${mode === 'overlay'}" ${both ? '' : 'disabled'}>Overlay</button>` : ''}</div>
      <div class="right">${large ? '<button type="button" class="btn sm" data-close>Close</button>' : (s.shot_status === 'ready' ? '<button type="button" class="btn sm" data-expand>Expand</button>' : '')}</div></div>`;
    let body;
    if (mode === 'side') {
      body = `<div class="viewer"><div class="cols"><div class="col"><div class="cap">Previous · ${stamp(b.captured_at)}</div>${shotHTML(b, 'half', 'Previous screenshot')}</div><div class="col"><div class="cap">Selected · ${stamp(s.captured_at)}</div>${shotHTML(s, 'half', 'Selected screenshot')}</div></div></div>`;
    } else if (mode === 'overlay') {
      body = `<div class="viewer"><div class="reveal"><span>Previous</span><input type="range" min="0" max="100" value="${split}" data-split aria-label="Reveal previous screenshot"><span>Selected</span></div>
        <div class="frame ov" tabindex="0" role="region" aria-label="Overlay comparison, scrollable" style="--split:${split}%"><div class="ov-inner"><img src="/api/screenshots/${esc(s.id)}" alt="Selected screenshot" decoding="async"><div class="ov-top"><img src="/api/screenshots/${esc(b.id)}" alt="Previous screenshot" decoding="async"></div><div class="ov-line"></div></div></div></div>`;
    } else body = `<div class="viewer">${shotHTML(s, '', 'Selected screenshot')}</div>`;
    const notes = [];
    if (mode === 'shot' && s.shot_status === 'ready') notes.push(`Captured ${stamp(s.shot_at)}`);
    if (s.shot_truncated) notes.push('Capture truncated at 6000px');
    if (s.late) notes.push('Captured late, image hash recorded outside the chain');
    return bar + body + (large ? '' : `<div class="stage-cap">${notes.map(n => `<span>${esc(n)}</span>`).join('')}</div>`);
  }
  function mountImages(scope) {
    $$('.frame', scope).forEach(f => {
      const imgs = $$('img', f); if (!imgs.length) return;
      const done = () => { if (imgs.every(i => i.complete)) f.classList.add('ready'); };
      imgs.forEach(i => { if (i.complete) done(); else { i.addEventListener('load', done, { once: true }); i.addEventListener('error', () => { f.classList.add('none'); f.textContent = 'Screenshot unavailable'; }, { once: true }); } });
    });
  }
  function drawViewer() {
    $('#stage').innerHTML = viewerHTML(false); mountImages($('#stage'));
    if (lightbox) { $('#lb-body').innerHTML = viewerHTML(true); mountImages($('#lb-body')); }
  }

  function drawTicks() {
    $$('.tick').forEach((el, i) => { el.setAttribute('aria-pressed', String(i === idx)); el.tabIndex = i === idx ? 0 : -1; });
    const t = $('#ticks'), el = $$('.tick')[idx];
    t.scrollTo({ left: el.offsetLeft - (t.clientWidth - el.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
  }

  async function drawDiff() {
    const s = snaps[idx], bi = baseIdx(), b = snaps[bi];
    $('#ch-h').textContent = b ? 'What changed' : 'Baseline';
    $('#cmp-wrap').hidden = !b;
    $('#summary').innerHTML = ''; $('#noise').textContent = '';
    if (!b) { $('#diff').innerHTML = '<p class="none-msg">First recorded observation. Earlier history is unknown.</p>'; return; }
    $('#cmp').innerHTML = `<option value="">Previous version</option>${snaps.slice(0, idx).map((x, i) => i === idx - 1 ? '' : `<option value="${i}" ${other === i ? 'selected' : ''}>${esc(stamp(x.captured_at))}</option>`).join('')}`;
    $('#diff').innerHTML = '<div class="skel" aria-hidden="true"><i></i><i></i><i></i></div>';
    const key = `${b.captured_at}|${s.captured_at}`;
    try {
      if (!diffCache.has(key)) diffCache.set(key, api(`/api/pages/${id}/diff?from=${encodeURIComponent(b.captured_at)}&to=${encodeURIComponent(s.captured_at)}`));
      const d = await diffCache.get(key);
      if (snaps[idx]?.id !== s.id || baseIdx() !== bi) return;
      const n = t => d.blocks.filter(x => x.type === t).length;
      $('#summary').innerHTML = ['changed', 'added', 'removed'].filter(n).map(t => `<span class="chip ${t}">${n(t)} ${t}</span>`).join('');
      $('#noise').textContent = `${d.noise_lines_dropped} noise lines dropped · ${d.noise_lines_masked} date/time lines masked`;
      $('#diff').innerHTML = d.blocks.map(x => {
        const ctx = contextFor(x.after ? s.text : b.text, x.after || x.before);
        return `<article class="block"><div class="kind ${x.type}">${esc(x.type)}</div><div class="body">${ctx ? `<span class="ctx">${esc(ctx)}</span>` : ''}${blockBody(x)}</div></article>`;
      }).join('') || '<p class="none-msg">No meaningful text changes.</p>';
    } catch (err) { diffCache.delete(key); if (snaps[idx]?.id === s.id) $('#diff').innerHTML = `<p class="none-msg error">${esc(err.message)}</p>`; }
  }

  function draw(focusTick = false) {
    const s = snaps[idx], n = snaps.length;
    if (other !== null && other >= idx) other = null;
    history.replaceState(null, '', idx === n - 1 ? location.pathname : `${location.pathname}?s=${s.id}`);
    $('#vdate').textContent = fmt.long(s.captured_at);
    $('#vsub').innerHTML = `${fmt.time(s.captured_at)} · Version ${idx + 1} of ${n}${idx === 0 ? ' · Baseline' : ''} · <a href="${safeSource(s.final_url)}" target="_blank" rel="noopener">Source page</a>`;
    $('#pos').textContent = `${idx + 1} / ${n}`;
    $('#prev').disabled = idx === 0; $('#next').disabled = idx === n - 1;
    $('#fulltext').textContent = s.text;
    $('#evidence').innerHTML = [
      ['Observed', stamp(s.captured_at), 1],
      ['Screenshot', (s.shot_at ? stamp(s.shot_at) : s.shot_status) + (s.late ? ' · captured late, image hash recorded outside the chain' : ''), 1],
      ['Run', s.run_id], ['Text SHA-256', s.text_sha], ['Image SHA-256', s.shot_sha ?? 'pending'], ['Chain link', s.link],
    ].map(([k, v, plain]) => `<dt>${k}</dt><dd class="${plain ? 'plain' : ''}">${esc(v)}</dd>`).join('');
    drawTicks(); drawViewer(); drawDiff();
    if (focusTick) $$('.tick')[idx].focus({ preventScroll: true });
  }
  const go = (i, focus) => { i = Math.max(0, Math.min(snaps.length - 1, i)); if (i !== idx) { idx = i; draw(focus); } };

  /* scrubbing: click, drag (mouse), arrows / Home / End */
  const ticks = $('#ticks');
  ticks.addEventListener('click', e => { const t = e.target.closest('.tick'); if (t) go(Number(t.dataset.i), true); });
  let dragging = false;
  ticks.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' && e.button === 0) dragging = true; });
  addEventListener('pointerup', () => { dragging = false; });
  ticks.addEventListener('pointermove', e => { if (!dragging) return; const t = document.elementFromPoint(e.clientX, e.clientY)?.closest('.tick'); if (t) go(Number(t.dataset.i), true); });
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || lightbox && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    const focus = !!document.activeElement?.closest?.('.tick');
    const to = { ArrowLeft: idx - 1, ArrowRight: idx + 1, Home: 0, End: snaps.length - 1 }[e.key];
    if (to === undefined) return;
    if (e.key === 'Home' || e.key === 'End') { if (!focus) return; }
    e.preventDefault(); go(to, focus);
  });
  $('#prev').onclick = () => go(idx - 1); $('#next').onclick = () => go(idx + 1);
  $('#cmp').onchange = e => { other = e.target.value === '' ? null : Number(e.target.value); drawViewer(); drawDiff(); };

  /* viewer controls (inline stage + lightbox) */
  const lb = $('#lb');
  document.addEventListener('click', e => {
    const m = e.target.closest('[data-mode]');
    if (m) { mode = m.dataset.mode; drawViewer(); return; }
    if (e.target.closest('[data-expand]')) { lightbox = true; $('#lb-body').innerHTML = viewerHTML(true); mountImages($('#lb-body')); lb.showModal(); return; }
    if (e.target.closest('[data-close]') || e.target === lb) lb.close();
  });
  lb.addEventListener('close', () => { lightbox = false; });
  document.addEventListener('input', e => { const r = e.target.closest?.('[data-split]'); if (!r) return; split = Number(r.value); $$('.ov').forEach(o => o.style.setProperty('--split', split + '%')); $$('[data-split]').forEach(x => { x.value = split; }); });
  let syncing = false;
  document.addEventListener('scroll', e => {
    const f = e.target; if (syncing || !f.classList?.contains('half')) return;
    syncing = true; $$('.half', f.closest('.cols')).forEach(o => { if (o !== f) o.scrollTop = f.scrollTop; }); requestAnimationFrame(() => { syncing = false; });
  }, true);

  /* as-of */
  $('#asof').onsubmit = async e => {
    e.preventDefault();
    const msg = $('#asof-status'); msg.className = 'asof-msg'; msg.textContent = '';
    try {
      const b = await api(`/api/pages/${id}/as-of?at=` + encodeURIComponent(new Date($('#at').value).toISOString()));
      const i = snaps.findIndex(s => s.id === b.snapshot.id); if (i < 0) throw Error('Version not in this timeline');
      idx = i; other = null; draw();
      msg.textContent = `Version ${i + 1} · observed ${stamp(b.observed_at)}. ${b.precision}.`;
    } catch (err) { msg.textContent = err.message; msg.className = 'asof-msg error'; }
  };

  /* verification */
  $('#verify').onclick = async () => {
    const label = $('#verified'); label.className = ''; label.textContent = 'Recomputing hashes…';
    try {
      let prev = await hash('time-machine:' + id), images = 0;
      for (let i = 0; i < snaps.length; i++) {
        const s = snaps[i];
        if (await hash(s.text) !== s.text_sha || await link(prev, s) !== s.link || (s.chain_shot_sha && s.chain_shot_sha !== s.shot_sha)) throw Error('Broken at snapshot ' + (i + 1));
        if (s.shot_sha) { const r = await fetch('/api/screenshots/' + s.id); if (!r.ok || await hash(await r.arrayBuffer()) !== s.shot_sha) throw Error('Image integrity failed at snapshot ' + (i + 1)); images++; }
        prev = s.link;
      }
      label.className = 'ok'; label.textContent = `Chain intact · ${snaps.length} versions · ${images} images verified`;
    } catch (err) { label.className = 'error'; label.textContent = err.message; }
  };

  /* refresh pending screenshots for 90 seconds */
  let polls = 0;
  const timer = setInterval(async () => {
    if (++polls > 18 || !snaps.some(s => s.shot_status === 'pending')) { clearInterval(timer); return; }
    try { const latest = await api(`/api/pages/${id}/snapshots`); snaps.splice(0, snaps.length, ...latest.snapshots); drawViewer(); } catch { clearInterval(timer); }
  }, 5000);
  draw();
}

/* ───────── boot ───────── */

const match = location.pathname.match(/^\/p\/([\w-]+)$/);
(match ? timeline(match[1]) : home()).catch(e => {
  root.innerHTML = `<div class="state"><p class="msg">${esc(e.message)}</p><div class="acts"><a class="btn" href="/">All pages</a><button class="btn primary" onclick="location.reload()">Retry</button></div></div>`;
});
