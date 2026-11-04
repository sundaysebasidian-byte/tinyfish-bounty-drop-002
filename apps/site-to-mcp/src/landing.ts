export const css = `
:root{color-scheme:light dark;--bg:#fafaf8;--fg:#14140f;--mute:#66655d;--line:#e4e3dc;--panel:#f1f0eb;--accent:#c2352b;--ok:#17734a;--bad:#b3261e;--warn:#8a5a00;--sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace}
@media (prefers-color-scheme:dark){:root{--bg:#0d0d0b;--fg:#ecebe3;--mute:#9b9a90;--line:#26261f;--panel:#151512;--accent:#ff7466;--ok:#4cc38a;--bad:#ff6b61;--warn:#e0b04a}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 var(--sans);-webkit-font-smoothing:antialiased}
main{max-width:46rem;margin:0 auto;padding:0 24px 72px}
a{color:inherit;text-decoration-color:var(--mute);text-underline-offset:3px}
a:hover{text-decoration-color:var(--accent)}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px}
code,pre{font-family:var(--mono)}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
header{padding-top:clamp(56px,14vh,136px)}
h1{margin:0;font-size:clamp(2.75rem,9vw,5rem);line-height:1;letter-spacing:-.045em;font-weight:650;text-wrap:balance}
.lede{margin:24px 0 0;max-width:30rem;color:var(--mute);font-size:1.125rem;line-height:1.5}
.pill{display:inline-flex;align-items:center;gap:10px;height:34px;margin-top:36px;padding:0 14px 0 12px;border:1px solid var(--line);border-radius:999px;font:13px/1 var(--mono);text-decoration:none;white-space:nowrap}
.pill:hover{border-color:var(--mute)}
.dot{flex:none;width:8px;height:8px;border-radius:50%;background:var(--mute)}
[data-s=ok] .dot,.dot.ok{background:var(--ok)}
[data-s=bad] .dot,.dot.no{background:var(--bad)}
[data-s=warn] .dot{background:var(--warn)}
section{margin-top:clamp(72px,11vw,128px)}
.head{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding-top:16px;border-top:1px solid var(--line);margin-bottom:28px}
h2{margin:0;font-size:.8125rem;line-height:1.4;font-weight:500;letter-spacing:.02em;color:var(--mute)}
.meta{font:12px/1.4 var(--mono);color:var(--mute);text-align:right}
.tabs{display:flex;gap:4px;margin:0 -12px;overflow-x:auto;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{flex:none;appearance:none;background:none;border:0;border-bottom:2px solid transparent;margin:0;padding:10px 12px;color:var(--mute);font:500 14px/1.2 var(--sans);cursor:pointer}
.tab:hover{color:var(--fg)}
.tab[aria-selected=true]{color:var(--fg);border-bottom-color:var(--fg)}
.panels{margin-top:16px}
.js .panels{display:grid}
.panel{min-width:0}
.js .panel{grid-area:1/1;visibility:hidden}
.js .panel.on{visibility:visible}
.panel::before{content:attr(data-label);display:block;margin:0 0 8px;font-size:14px;font-weight:500}
.js .panel::before{display:none}
.panel+.panel{margin-top:24px}
.js .panel+.panel{margin-top:0}
.code{height:100%;background:var(--panel);border-radius:12px;min-width:0}
.code-h{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 8px 0 20px;min-height:44px}
.code-h span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:12px/1.4 var(--mono);color:var(--mute)}
.copy{flex:none;display:none;min-width:72px;height:32px;padding:0 12px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg);font:500 13px/1 var(--sans);cursor:pointer}
.js .copy{display:block}
.copy:hover{border-color:var(--mute)}
.copy[data-done]{color:var(--ok)}
pre{margin:0;padding:4px 20px 20px;overflow-x:auto;font-size:13.5px;line-height:1.65;tab-size:2}
.tools{margin:0;padding:0;list-style:none}
.tools li{display:grid;grid-template-columns:12rem minmax(0,1fr);gap:4px 32px;padding:22px 0;border-top:1px solid var(--line)}
.tools li:first-child{border-top:0;padding-top:0}
.n{font:600 14px/1.5 var(--mono)}
.p{display:block;margin-top:2px;font:12px/1.5 var(--mono);color:var(--mute)}
.sig{display:block;font:13px/1.65 var(--mono);overflow-wrap:anywhere}
.sig i{font-style:normal;color:var(--mute)}
.d{margin:6px 0 0;color:var(--mute);font-size:15px;line-height:1.5}
.rows{margin:0;padding:0;list-style:none}
.rows li{display:grid;grid-template-columns:8px 11rem minmax(0,1fr) 4.5rem;gap:0 16px;align-items:baseline;padding:14px 0;border-top:1px solid var(--line);font-size:14px;line-height:1.5}
.rows li:first-child{border-top:0;padding-top:0}
.rows .dot{align-self:start;margin-top:8px}
.rows .t{font:600 14px/1.5 var(--mono)}
.rows .r{color:var(--mute)}
.rows .ms{font:12px/1.5 var(--mono);color:var(--mute);text-align:right}
.rows .f{color:var(--bad);font-weight:600}
.log{background:var(--panel);border-radius:12px;padding:24px 20px;font-size:13px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere}
.log .u{display:block;margin-bottom:20px;font:500 1.0625rem/1.5 var(--sans);white-space:normal}
.log .u b{display:block;margin-bottom:2px;font:12px/1.5 var(--mono);color:var(--mute);font-weight:400}
.log .c{display:block;font-weight:600}
.log .o{display:block;margin-bottom:20px;color:var(--mute)}
.log .o:last-child{margin-bottom:0}
footer{margin-top:clamp(72px,11vw,128px);padding-top:16px;border-top:1px solid var(--line);color:var(--mute);font-size:13px;line-height:1.6}
@media (max-width:640px){
main{padding:0 20px 56px}
.tools li{grid-template-columns:1fr}
.rows li{grid-template-columns:8px minmax(0,1fr) auto;row-gap:2px}
.rows .r{grid-column:2/4;grid-row:2}
.code-h{padding-left:16px}
pre{padding:4px 16px 16px}
.log{padding:20px 16px}
}
@media (prefers-reduced-motion:no-preference){.tab,.copy,.pill{transition:color .15s,border-color .15s}}
`;

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

const tabs = (url: string) => [
  {
    id: "claude-code",
    label: "Claude Code",
    file: "Terminal",
    code: `claude mcp add --transport http pcc ${url}`,
  },
  {
    id: "claude-desktop",
    label: "Claude Desktop",
    file: "claude_desktop_config.json",
    code: `{\n  "mcpServers": {\n    "pcc": {\n      "command": "npx",\n      "args": ["-y", "mcp-remote", ${JSON.stringify(url)}]\n    }\n  }\n}`,
  },
  {
    id: "cursor",
    label: "Cursor",
    file: ".cursor/mcp.json",
    code: `{\n  "mcpServers": {\n    "pcc": { "url": ${JSON.stringify(url)} }\n  }\n}`,
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    file: "Settings → Connectors → URL",
    code: url,
  },
  {
    id: "stdio",
    label: "stdio",
    file: "Terminal",
    code: "npx --prefix /absolute/path/to/apps/site-to-mcp site-to-mcp",
  },
];

const tools: [string, string, string, string][] = [
  [
    "search_films",
    "Search · Fetch",
    "(<i>query:</i> string) → { films: Film[], total_in_programme: number }",
    "Find titles in the live programme.",
  ],
  [
    "get_film",
    "Fetch",
    "(<i>film_id:</i> string) → { title, year, runtime_minutes, certificate, country, genre, director }",
    "Facts from the film page.",
  ],
  [
    "get_screenings",
    "Fetch",
    "(<i>film_id:</i> string) → { timezone, screenings: { performance_id, date_label, time, tags, booking_url }[] }",
    "Dates, London times, format tags, booking links. No availability inferred.",
  ],
  [
    "list_by_format",
    "Fetch",
    "(<i>modifier:</i> &quot;35mm&quot; | &quot;70mm&quot; | &quot;4K&quot; | &quot;HOH&quot;, <i>offset?:</i> int = 0, <i>limit?:</i> int = 100) → { films: Film[], total, offset, limit, next_offset: int | null }",
    "Every film in a format, sold-out shows included. Follow next_offset until null.",
  ],
  [
    "filter_programme",
    "Agent · Fetch",
    "(<i>modifier:</i> Modifier) → { films: Film[], filter_applied, cached, run_id } | { status: &quot;PENDING&quot;, run_id }",
    "Agent verifies the filter UI; the full list comes from Fetch. Async, paid, cached 6 h.",
  ],
  [
    "get_run_result",
    "Agent",
    "(<i>run_id:</i> uuid) → { status: &quot;PENDING&quot; } | filter_programme result",
    "Poll an async filter run.",
  ],
  [
    "health_check",
    "Fetch",
    "() → { ok, checked_at, tools: { tool, ok, reason, duration_ms }[] }",
    "Live Fetch checks plus the timestamped Agent replay. Never starts a paid run.",
  ],
];

const healthTools = [
  "get_film",
  "get_screenings",
  "search_films",
  "list_by_format",
  "filter_programme",
];

const session = `<span class="u"><b>User</b>Find Akira and check the runtime, director and upcoming screening times.</span><span class="c">search_films({ &quot;query&quot;: &quot;Akira&quot; })</span><span class="o">{ &quot;films&quot;: [{ &quot;film_id&quot;: &quot;1808&quot;, &quot;title&quot;: &quot;Akira&quot; }], &quot;total_in_programme&quot;: 294, … }</span><span class="c">get_film({ &quot;film_id&quot;: &quot;1808&quot; })</span><span class="o">{ &quot;title&quot;: &quot;Akira&quot;, &quot;year&quot;: 1988, &quot;runtime_minutes&quot;: 125, &quot;certificate&quot;: &quot;(15)&quot;, &quot;director&quot;: &quot;Katsuhiro Ôtomo&quot;, … }</span><span class="c">get_screenings({ &quot;film_id&quot;: &quot;1808&quot; })</span><span class="o">{ &quot;timezone&quot;: &quot;Europe/London&quot;, &quot;screenings&quot;: [
  { &quot;date_label&quot;: &quot;Friday 6th November&quot;, &quot;time&quot;: &quot;8:45 pm&quot;, &quot;tags&quot;: [&quot;35mm&quot;, &quot;SUB&quot;], … },
  { &quot;date_label&quot;: &quot;Saturday 7th November&quot;, &quot;time&quot;: &quot;2:35 pm&quot;, &quot;tags&quot;: [&quot;35mm&quot;, &quot;SUB&quot;], … }, … ] }</span>`;

const script = `(function(){
var d=document,r=d.documentElement;r.classList.add("js");
var tabs=[].slice.call(d.querySelectorAll("[role=tab]")),panels=[].slice.call(d.querySelectorAll("[role=tabpanel]"));
function pick(i,focus){tabs.forEach(function(t,j){var on=i===j;t.setAttribute("aria-selected",on);t.tabIndex=on?0:-1;panels[j].classList.toggle("on",on);});if(focus)tabs[i].focus();}
tabs.forEach(function(t,i){t.addEventListener("click",function(){pick(i)});t.addEventListener("keydown",function(e){var n=i;if(e.key==="ArrowRight")n=(i+1)%tabs.length;else if(e.key==="ArrowLeft")n=(i+tabs.length-1)%tabs.length;else if(e.key==="Home")n=0;else if(e.key==="End")n=tabs.length-1;else return;e.preventDefault();pick(n,true);});});
pick(0);
[].forEach.call(d.querySelectorAll(".copy"),function(b){b.addEventListener("click",function(){var text=b.closest(".code").querySelector("pre").textContent;
function done(){b.textContent="Copied";b.setAttribute("data-done","");d.getElementById("live").textContent="Copied to clipboard";setTimeout(function(){b.textContent="Copy";b.removeAttribute("data-done");d.getElementById("live").textContent="";},1600);}
if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,fallback);}else fallback();
function fallback(){var a=d.createElement("textarea");a.value=text;a.setAttribute("readonly","");a.style.cssText="position:fixed;opacity:0";d.body.appendChild(a);a.select();try{d.execCommand("copy");done();}catch(e){}d.body.removeChild(a);}
});});
var pill=d.getElementById("pill"),ptxt=d.getElementById("pill-text"),when=d.getElementById("when"),rows=d.getElementById("rows"),checked=null;
function ago(ms){var m=Math.round(ms/60000);if(m<1)return "just now";if(m<60)return m+" min ago";var h=Math.round(m/60);if(h<48)return h+" h ago";return Math.round(h/24)+" d ago";}
function utc(t){return new Date(t).toLocaleString("en-GB",{timeZone:"UTC",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",hour12:false})+" UTC";}
function set(s,text){pill.setAttribute("data-s",s);ptxt.textContent=text;}
function age(){if(!checked)return;var ms=Date.now()-checked.getTime();ptxt.textContent=pill.getAttribute("data-base")+" · "+ago(ms);if(ms>30*3600*1000&&pill.getAttribute("data-s")==="ok")pill.setAttribute("data-s","warn");}
function el(tag,cls,text){var e=d.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
function render(h){
var list=h.tools||[],bad=list.filter(function(t){return !t.ok}).length;
checked=new Date(h.checked_at);
pill.setAttribute("data-base",h.ok&&!bad?"All "+list.length+" tools healthy":(bad?bad+" of "+list.length+" tools failing":"Unhealthy"));
pill.setAttribute("data-s",h.ok&&!bad?"ok":"bad");age();
when.innerHTML="";var tm=el("time",null,utc(h.checked_at));tm.dateTime=h.checked_at;when.appendChild(tm);
rows.innerHTML="";
list.forEach(function(t){var li=el("li");var dot=el("span","dot "+(t.ok?"ok":"no"));dot.setAttribute("aria-hidden","true");
var name=el("code","t",t.tool);var reason=el("span","r");if(!t.ok){reason.appendChild(el("span","f","Failing · "));}
reason.appendChild(d.createTextNode(String(t.reason||"").split(": {")[0]));
li.appendChild(dot);li.appendChild(name);li.appendChild(reason);li.appendChild(el("span","ms",t.duration_ms+" ms"));
rows.appendChild(li);});
}
function fail(text){set("bad",text);when.textContent="";}
fetch("/health",{headers:{accept:"application/json"}}).then(function(res){return res.json().then(function(j){return {res:res,j:j}})}).then(function(x){if(x.j&&x.j.checked_at&&x.j.tools)render(x.j);else fail("No health report yet");}).catch(function(){fail("Health unavailable");});
setInterval(age,60000);
})();`;

export function landing(origin: string) {
  const url = `${origin}/mcp`;
  const t = tabs(url);
  const tabList = t
    .map(
      (x, i) =>
        `<button class="tab" role="tab" id="tab-${x.id}" aria-controls="p-${x.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${x.label}</button>`,
    )
    .join("");
  const panels = t
    .map(
      (x, i) =>
        `<div class="panel${i === 0 ? " on" : ""}" role="tabpanel" id="p-${x.id}" aria-labelledby="tab-${x.id}" data-label="${x.label}"><div class="code"><div class="code-h"><span>${esc(x.file)}</span><button class="copy" type="button" aria-label="Copy ${x.label} snippet">Copy</button></div><pre tabindex="0"><code>${esc(x.code)}</code></pre></div></div>`,
    )
    .join("");
  const toolList = tools
    .map(
      ([n, p, sig, desc]) =>
        `<li><div><code class="n">${n}</code><span class="p">${p}</span></div><div><code class="sig">${sig}</code><p class="d">${desc}</p></div></li>`,
    )
    .join("");
  const rows = healthTools
    .map(
      (n) =>
        `<li><span class="dot" aria-hidden="true"></span><code class="t">${n}</code><span class="r">Checking</span><span class="ms">—</span></li>`,
    )
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="description" content="Prince Charles Cinema as an MCP server: films, screenings and format discovery for your agent."><title>Prince Charles Cinema · MCP</title><link rel="stylesheet" href="/style.css"></head><body><main><header><h1>A cinema your agent can read.</h1><p class="lede">Live from <a href="https://princecharlescinema.com/">London’s Prince Charles Cinema</a>, with sources and timestamps.</p><a class="pill" id="pill" href="#health" data-s="idle"><span class="dot" aria-hidden="true"></span><span id="pill-text">Checking health</span></a></header><section aria-labelledby="install"><div class="head"><h2 id="install">Install</h2></div><div class="tabs" role="tablist" aria-label="Client">${tabList}</div><div class="panels">${panels}</div></section><section aria-labelledby="tools"><div class="head"><h2 id="tools">Tools</h2></div><ul class="tools">${toolList}</ul></section><section aria-labelledby="health-h" id="health"><div class="head"><h2 id="health-h">Health</h2><span class="meta">Checked <span id="when">—</span> · <a href="/health">JSON</a></span></div><ul class="rows" id="rows">${rows}</ul></section><section aria-labelledby="session"><div class="head"><h2 id="session">Recorded session</h2><span class="meta">3 Nov 2026 · live MCP</span></div><pre class="log" tabindex="0" aria-label="Recorded MCP session"><code>${session}</code></pre></section><footer>Read-only. Powered by TinyFish Search, Fetch and Agent. Independent, not affiliated with the cinema.</footer></main><div class="sr" id="live" role="status" aria-live="polite"></div><script>${script}</script></body></html>`;
}
