import * as http from "http";
import { runResearchAgent } from "./agent.js";
import type { ResearchConfig } from "./types.js";

const PORT = 4568;

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Research Agent</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    :root {
      --bg: #0c0e16;
      --surface: #13172280;
      --surface-solid: #131722;
      --surface-2: #1a2030;
      --border: #22293d;
      --accent: #5b8df6;
      --accent-bg: #0f1e42;
      --accent-border: #1e3a7a;
      --text: #dde4f0;
      --text-dim: #5a6a8a;
      --text-muted: #2e3a52;
      --amber: #f59e0b;
      --purple: #a78bfa;
      --cyan: #38bdf8;
      --green: #34d399;
      --red: #f87171;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; overflow: hidden; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      flex-direction: column;
      height: 100vh;
    }

    /* ── Header ── */
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      height: 52px;
      border-bottom: 1px solid var(--border);
      background: rgba(13,15,22,0.9);
      backdrop-filter: blur(12px);
      flex-shrink: 0;
      position: relative;
      z-index: 10;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      font-size: 0.95rem;
      letter-spacing: -0.01em;
    }
    .logo-icon {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #4f46e5, #6d28d9);
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
    }
    .model-badge {
      font-size: 0.7rem;
      color: var(--text-dim);
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 100px;
      padding: 0.18rem 0.55rem;
      letter-spacing: 0.01em;
    }

    /* ── Chat ── */
    .chat {
      flex: 1;
      overflow-y: auto;
      padding: 2rem 1rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .chat::-webkit-scrollbar { width: 5px; }
    .chat::-webkit-scrollbar-track { background: transparent; }
    .chat::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

    /* Welcome */
    .welcome {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding-bottom: 4rem;
    }
    .welcome-glyph {
      font-size: 2.4rem;
      opacity: 0.18;
      filter: grayscale(1);
    }
    .welcome-text {
      font-size: 0.88rem;
      color: var(--text-muted);
    }

    /* ── Messages ── */
    .msg {
      display: flex;
      gap: 0.65rem;
      max-width: 760px;
      width: 100%;
    }
    .msg.user { align-self: flex-end; flex-direction: row-reverse; }
    .msg.agent { align-self: flex-start; }

    .avatar {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .agent .avatar {
      background: linear-gradient(135deg, #4338ca, #7c3aed);
      box-shadow: 0 0 0 1px rgba(99,102,241,0.3);
    }

    .bubble {
      padding: 0.65rem 0.9rem;
      border-radius: 12px;
      line-height: 1.65;
      max-width: calc(100% - 42px);
      font-size: 0.92rem;
    }
    .user .bubble {
      background: var(--accent-bg);
      border: 1px solid var(--accent-border);
      color: #b8d0ff;
      border-radius: 12px 2px 12px 12px;
    }
    .agent .bubble {
      background: var(--surface-solid);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 2px 12px 12px 12px;
      min-width: 60px;
    }

    /* Markdown */
    .agent .bubble h1 { font-size: 1.25rem; color: #93c5fd; margin: 1.1rem 0 0.45rem; font-weight: 700; }
    .agent .bubble h2 { font-size: 1.05rem; color: #bfdbfe; margin: 0.9rem 0 0.35rem; font-weight: 600; }
    .agent .bubble h3 { font-size: 0.93rem; color: #dbeafe; margin: 0.7rem 0 0.25rem; font-weight: 600; }
    .agent .bubble h1:first-child, .agent .bubble h2:first-child, .agent .bubble h3:first-child { margin-top: 0; }
    .agent .bubble p { margin: 0.4rem 0; }
    .agent .bubble p:first-child { margin-top: 0; }
    .agent .bubble ul, .agent .bubble ol { padding-left: 1.4rem; margin: 0.35rem 0; }
    .agent .bubble li { margin: 0.18rem 0; }
    .agent .bubble code {
      background: rgba(13,18,32,0.9);
      color: #86efac;
      padding: 0.08em 0.32em;
      border-radius: 4px;
      font-size: 0.85em;
      font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
      border: 1px solid #1a2540;
    }
    .agent .bubble pre {
      background: #090d18;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.85rem 1rem;
      overflow-x: auto;
      margin: 0.6rem 0;
    }
    .agent .bubble pre code { background: none; padding: 0; color: #cbd5e1; border: none; font-size: 0.87em; }
    .agent .bubble a { color: #7dd3fc; text-decoration: none; border-bottom: 1px solid #2a4a6a; }
    .agent .bubble a:hover { border-color: #7dd3fc; }
    .agent .bubble blockquote { border-left: 2px solid var(--border); padding-left: 0.7rem; color: var(--text-dim); margin: 0.5rem 0; font-style: italic; }
    .agent .bubble hr { border: none; border-top: 1px solid var(--border); margin: 0.7rem 0; }
    .agent .bubble strong { color: #f1f5f9; }
    .agent .bubble em { color: #94a3b8; }
    .agent .bubble table { border-collapse: collapse; width: 100%; font-size: 0.87em; margin: 0.6rem 0; }
    .agent .bubble th { background: #090d18; padding: 0.38rem 0.65rem; border: 1px solid var(--border); text-align: left; color: #93c5fd; font-weight: 600; }
    .agent .bubble td { padding: 0.3rem 0.65rem; border: 1px solid var(--border); }
    .agent .bubble tr:nth-child(even) { background: rgba(255,255,255,0.02); }

    /* Cursor */
    .cursor {
      display: inline-block;
      width: 2px;
      height: 0.9em;
      background: var(--accent);
      margin-left: 1px;
      vertical-align: text-bottom;
      border-radius: 1px;
      animation: blink 1s ease-in-out infinite;
    }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

    /* Loading dots */
    .dots { display: inline-flex; align-items: center; gap: 3px; padding: 2px 0; }
    .dots span {
      width: 5px; height: 5px; border-radius: 50%;
      background: var(--text-dim);
      animation: bounce 1.2s ease-in-out infinite;
    }
    .dots span:nth-child(2) { animation-delay: 0.2s; }
    .dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { 0%,80%,100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-4px); opacity: 1; } }

    /* ── Activity rows ── */
    .activity-row {
      align-self: flex-start;
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      padding-left: 42px;
      max-width: 760px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.74rem;
      padding: 0.18rem 0.55rem;
      border-radius: 100px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      max-width: 440px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pill.search  { background: #1a1535; border: 1px solid #332a60; color: var(--purple); }
    .pill.fetch   { background: #0d1e30; border: 1px solid #183550; color: var(--cyan); }
    .pill.code    { background: #0c1e14; border: 1px solid #183526; color: var(--green); }

    /* ── Thinking ── */
    .thinking-row {
      align-self: flex-start;
      padding-left: 42px;
      max-width: 760px;
    }
    .thinking-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.76rem;
      color: var(--amber);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.2rem 0;
      opacity: 0.6;
      transition: opacity 0.15s;
    }
    .thinking-toggle:hover { opacity: 1; }
    .chevron { display: inline-block; transition: transform 0.2s; font-size: 0.65rem; }
    .thinking-toggle.open .chevron { transform: rotate(180deg); }
    .thinking-body {
      display: none;
      margin-top: 0.4rem;
      padding: 0.65rem 0.8rem;
      background: #100e00;
      border: 1px solid #2a2200;
      border-radius: 8px;
      font-size: 0.79rem;
      color: #7a5f10;
      white-space: pre-wrap;
      line-height: 1.55;
      max-height: 260px;
      overflow-y: auto;
      font-family: 'SF Mono', 'Fira Code', monospace;
    }
    .thinking-body.open { display: block; }

    /* ── Stats ── */
    .stats-row {
      align-self: flex-start;
      padding-left: 42px;
    }
    .stats-block {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.74rem;
      color: var(--text-dim);
      padding: 0.3rem 0.7rem;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 8px;
    }
    .stats-block b { color: var(--text-dim); font-weight: 500; }

    /* ── Saved ── */
    .saved-row { align-self: flex-start; padding-left: 42px; }
    .saved-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.76rem;
      color: var(--green);
      background: #081810;
      border: 1px solid #0f3020;
      border-radius: 6px;
      padding: 0.25rem 0.6rem;
    }

    /* ── Input ── */
    footer {
      flex-shrink: 0;
      padding: 0.75rem 1rem 1.25rem;
      background: var(--bg);
    }
    .input-wrap {
      max-width: 760px;
      margin: 0 auto;
      background: var(--surface-solid);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 0.55rem 0.55rem 0.55rem 1rem;
      display: flex;
      align-items: flex-end;
      gap: 0.45rem;
      transition: border-color 0.15s;
    }
    .input-wrap:focus-within { border-color: #2a3f7a; }
    textarea {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      color: var(--text);
      font-size: 0.92rem;
      font-family: inherit;
      resize: none;
      line-height: 1.55;
      max-height: 180px;
      min-height: 22px;
    }
    textarea::placeholder { color: var(--text-muted); }
    .controls { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }
    select {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 7px;
      color: var(--text-dim);
      font-size: 0.76rem;
      padding: 0.3rem 0.45rem;
      outline: none;
      cursor: pointer;
    }
    .send {
      width: 32px; height: 32px;
      border-radius: 8px;
      background: var(--accent);
      border: none;
      color: white;
      font-size: 1.05rem;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, transform 0.1s;
      flex-shrink: 0;
    }
    .send:hover:not(:disabled) { background: #4070e0; }
    .send:active:not(:disabled) { transform: scale(0.92); }
    .send:disabled { background: var(--surface-2); cursor: not-allowed; }
    .hint { max-width: 760px; margin: 0.45rem auto 0; font-size: 0.68rem; color: var(--text-muted); text-align: center; }
  </style>
</head>
<body>
  <header>
    <div class="logo">
      <div class="logo-icon">&#128269;</div>
      Research Agent
    </div>
    <span class="model-badge">claude&#8209;opus&#8209;4&#8209;6</span>
  </header>

  <div class="chat" id="chat">
    <div class="welcome" id="welcome">
      <div class="welcome-glyph">&#128269;</div>
      <div class="welcome-text">Ask me to research any topic</div>
    </div>
  </div>

  <footer>
    <div class="input-wrap">
      <textarea id="inp" rows="1" placeholder="Ask anything to research&#8230;" autocomplete="off"></textarea>
      <div class="controls">
        <select id="depth">
          <option value="quick">Quick</option>
          <option value="standard" selected>Standard</option>
          <option value="deep">Deep</option>
        </select>
        <button class="send" id="btn" title="Send (Enter)">&#8593;</button>
      </div>
    </div>
    <p class="hint">Web search &bull; web fetch &bull; code execution &bull; Shift+Enter for newline</p>
  </footer>

  <script>
    marked.setOptions({ breaks: true, gfm: true });

    const chat  = document.getElementById('chat');
    const inp   = document.getElementById('inp');
    const depth = document.getElementById('depth');
    const btn   = document.getElementById('btn');
    let   es    = null;

    // Auto-grow textarea
    inp.addEventListener('input', () => {
      inp.style.height = 'auto';
      inp.style.height = Math.min(inp.scrollHeight, 180) + 'px';
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
    });
    btn.addEventListener('click', submit);

    function scroll() { chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' }); }

    function esc(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function submit() {
      const topic = inp.value.trim();
      if (!topic || btn.disabled) return;
      if (es) { es.close(); es = null; }

      // Remove welcome screen
      const w = document.getElementById('welcome');
      if (w) w.remove();

      // User bubble
      const userRow = document.createElement('div');
      userRow.className = 'msg user';
      userRow.innerHTML = '<div class="bubble">' + esc(topic) + '</div>';
      chat.appendChild(userRow);
      scroll();

      inp.value = '';
      inp.style.height = 'auto';
      btn.disabled = true;

      // ── State ──
      let thinkingRow     = null;
      let thinkingBody    = null;
      let thinkingText    = '';
      let thinkingStart   = Date.now();
      let agentRow        = null;
      let agentBubble     = null;
      let responseBuf     = '';
      let activityRow     = null; // current grouped pill row

      function ensureAgent() {
        if (!agentRow) {
          agentRow = document.createElement('div');
          agentRow.className = 'msg agent';
          agentRow.innerHTML = '<div class="avatar">&#9881;</div>';
          agentBubble = document.createElement('div');
          agentBubble.className = 'bubble';
          agentBubble.innerHTML = '<div class="dots"><span></span><span></span><span></span></div>';
          agentRow.appendChild(agentBubble);
          chat.appendChild(agentRow);
          scroll();
        }
        return agentBubble;
      }

      function addPill(cls, icon, text) {
        // Continue appending to last activity-row only if it directly precedes agentRow
        const last = chat.lastElementChild;
        if (!activityRow || (last !== activityRow && last !== agentRow)) {
          activityRow = document.createElement('div');
          activityRow.className = 'activity-row';
          // Insert before agentRow if it exists, else append
          if (agentRow && agentRow.parentNode) {
            chat.insertBefore(activityRow, agentRow);
          } else {
            chat.appendChild(activityRow);
          }
        }
        const pill = document.createElement('span');
        pill.className = 'pill ' + cls;
        const truncated = text.length > 70 ? text.slice(0, 70) + '\\u2026' : text;
        pill.innerHTML = icon + ' ' + esc(truncated);
        activityRow.appendChild(pill);
        scroll();
      }

      es = new EventSource('/research?topic=' + encodeURIComponent(topic) + '&depth=' + depth.value);

      es.addEventListener('section', e => {
        const label = JSON.parse(e.data);
        const lower = label.toLowerCase();
        if (lower.includes('think')) {
          thinkingStart = Date.now();
          // Thinking row created lazily on first thinking text
        } else if (lower.includes('response') || lower.includes('report') || lower.includes('iteration')) {
          // Ensure agent bubble, switch from dots to cursor
          const b = ensureAgent();
          if (!responseBuf) {
            b.innerHTML = '<span class="cursor"></span>';
          }
        }
        scroll();
      });

      es.addEventListener('thinking', e => {
        const text = JSON.parse(e.data);
        thinkingText += text;
        if (!thinkingRow) {
          thinkingRow = document.createElement('div');
          thinkingRow.className = 'thinking-row';
          thinkingRow.innerHTML =
            '<button class="thinking-toggle" onclick="toggleThink(this)">' +
              '<span>&#128161;</span>' +
              '<span class="lbl">Thinking\\u2026</span>' +
              '<span class="chevron">&#9660;</span>' +
            '</button>' +
            '<div class="thinking-body"></div>';
          // Insert before agentRow if exists
          if (agentRow && agentRow.parentNode) {
            chat.insertBefore(thinkingRow, agentRow);
          } else {
            chat.appendChild(thinkingRow);
          }
          thinkingBody = thinkingRow.querySelector('.thinking-body');
        }
        thinkingBody.textContent += text;
        scroll();
      });

      es.addEventListener('response', e => {
        const text = JSON.parse(e.data);
        responseBuf += text;
        const b = ensureAgent();
        b.innerHTML = marked.parse(responseBuf) + '<span class="cursor"></span>';
        scroll();
      });

      es.addEventListener('tool', e => {
        const raw = JSON.parse(e.data);
        const lower = raw.toLowerCase();
        let cls = 'search', icon = '&#9889;';
        if (lower.startsWith('[web_fetch]') || lower.startsWith('[fetch]')) { cls = 'fetch'; icon = '&#127760;'; }
        else if (lower.startsWith('[code') || lower.startsWith('[bash')) { cls = 'code'; icon = '&#128187;'; }
        const detail = raw.replace(/^\\[[^\\]]+\\]\\s*/, '');
        addPill(cls, icon, detail);
      });

      es.addEventListener('stats', e => {
        // Finalise thinking label
        if (thinkingRow) {
          const secs = Math.round((Date.now() - thinkingStart) / 1000);
          const lbl = thinkingRow.querySelector('.lbl');
          if (lbl) lbl.textContent = 'Thought for ' + secs + 's';
        }
        try {
          const s = JSON.parse(JSON.parse(e.data));
          const elapsed = ((Date.now() - new Date(s.startTime).getTime()) / 1000).toFixed(1);
          const row = document.createElement('div');
          row.className = 'stats-row';
          row.innerHTML =
            '<div class="stats-block">' +
            '<b>&#128269;</b> ' + s.searchesPerformed + ' searches &nbsp;' +
            '<b>&#127760;</b> ' + s.pagesVisited + ' pages &nbsp;' +
            (s.codeExecutions ? '<b>&#128187;</b> ' + s.codeExecutions + ' code runs &nbsp;' : '') +
            '<b>&#9202;</b> ' + elapsed + 's' +
            '</div>';
          chat.appendChild(row);
          scroll();
        } catch (_) {}
      });

      es.addEventListener('saved', e => {
        const row = document.createElement('div');
        row.className = 'saved-row';
        row.innerHTML = '<div class="saved-chip">&#128196; Report saved: ' + esc(JSON.parse(e.data)) + '</div>';
        chat.appendChild(row);
        scroll();
      });

      es.addEventListener('file', e => {
        const row = document.createElement('div');
        row.className = 'saved-row';
        row.innerHTML = '<div class="saved-chip">&#128190; ' + esc(JSON.parse(e.data)) + '</div>';
        chat.appendChild(row);
        scroll();
      });

      es.addEventListener('error_msg', e => {
        const b = ensureAgent();
        b.innerHTML = '<span style="color:var(--red)">&#9747; ' + esc(JSON.parse(e.data)) + '</span>';
        scroll();
      });

      es.addEventListener('done', () => {
        if (agentBubble) {
          const cur = agentBubble.querySelector('.cursor');
          if (cur) cur.remove();
          if (responseBuf) agentBubble.innerHTML = marked.parse(responseBuf);
        }
        es.close(); es = null;
        btn.disabled = false;
        inp.focus();
        scroll();
      });

      es.onerror = () => {
        if (agentBubble) {
          const cur = agentBubble.querySelector('.cursor');
          if (cur) cur.remove();
          if (!responseBuf) agentBubble.innerHTML = '<span style="color:var(--red)">Connection lost.</span>';
        }
        es.close(); es = null;
        btn.disabled = false;
      };
    }

    function toggleThink(btn) {
      btn.classList.toggle('open');
      btn.nextElementSibling.classList.toggle('open');
    }
  </script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (url.pathname === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(HTML);
    return;
  }

  if (url.pathname === "/research" && req.method === "GET") {
    const topic = url.searchParams.get("topic") ?? "";
    const depthParam = url.searchParams.get("depth") ?? "standard";
    const depth = (["quick", "standard", "deep"].includes(depthParam)
      ? depthParam
      : "standard") as ResearchConfig["depth"];

    if (!topic) {
      res.writeHead(400);
      res.end("Missing topic");
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const send = (event: string, data: string) => {
      if (!res.writableEnded) {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      }
    };

    const uiOverride = {
      banner:     () => {},
      section:    (label: string) => send("section", label),
      thinking:   (text: string)  => send("thinking", text),
      response:   (text: string)  => send("response", text),
      toolCall:   (name: string, detail: string) => send("tool", `[${name}] ${detail}`),
      toolResult: () => {},
      codeRun:    (snippet: string) => send("tool", `[code] ${snippet}`),
      codeOutput: () => {}, // agent's text response already synthesises results
      fileSaved:  (name: string, dest: string) => send("file", `${name} \u2192 ${dest}`),
      status:     (_msg: string) => {}, // skip minor status noise
      stats:      (session: unknown) => send("stats", JSON.stringify(session)),
      error:      (msg: string) => send("error_msg", msg),
      saved:      (filePath: string) => send("saved", filePath),
    };

    try {
      await runResearchAgent({ topic, depth }, uiOverride);
    } catch (err) {
      send("error_msg", err instanceof Error ? err.message : String(err));
    }

    send("done", "");
    res.end();
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`\nResearch Agent  →  http://localhost:${PORT}\n`);
});
