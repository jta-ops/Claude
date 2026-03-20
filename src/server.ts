import * as http from "http";
import { runResearchAgent } from "./agent.js";
import type { ResearchConfig } from "./types.js";

const PORT = 4568;

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claude Research Agent</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f1117; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 900px; margin: 0 auto; padding: 2rem; }
    header { margin-bottom: 2rem; }
    h1 { font-size: 1.8rem; font-weight: 700; color: #7dd3fc; }
    .subtitle { color: #64748b; margin-top: 0.25rem; font-size: 0.95rem; }
    .form { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
    input[type=text] {
      flex: 1; padding: 0.7rem 1rem;
      background: #1e2432; border: 1px solid #334155; border-radius: 8px;
      color: #e2e8f0; font-size: 1rem; outline: none;
    }
    input[type=text]:focus { border-color: #7dd3fc; }
    select {
      padding: 0.7rem 1rem;
      background: #1e2432; border: 1px solid #334155; border-radius: 8px;
      color: #e2e8f0; font-size: 1rem; outline: none; cursor: pointer;
    }
    button {
      padding: 0.7rem 1.5rem;
      background: #3b82f6; border: none; border-radius: 8px;
      color: white; font-size: 1rem; font-weight: 600; cursor: pointer;
    }
    button:hover { background: #2563eb; }
    button:disabled { background: #475569; cursor: not-allowed; }
    .output {
      background: #1a1f2e; border: 1px solid #1e293b; border-radius: 12px;
      padding: 1.5rem; min-height: 240px;
    }
    .placeholder { color: #475569; text-align: center; padding: 4rem 0; }
    .section-label {
      color: #7dd3fc; font-weight: 600; font-size: 0.78rem;
      text-transform: uppercase; letter-spacing: 0.08em;
      margin: 1.25rem 0 0.4rem; border-top: 1px solid #1e293b; padding-top: 1rem;
    }
    .section-label:first-child { border-top: none; margin-top: 0; padding-top: 0; }
    .thinking-text { color: #4b5563; font-style: italic; font-size: 0.88rem; white-space: pre-wrap; line-height: 1.5; }
    .tool-text { color: #fbbf24; font-size: 0.88rem; font-family: monospace; margin: 0.2rem 0; }
    .status-text { color: #7dd3fc; font-size: 0.9rem; margin: 0.3rem 0; }
    .error-text { color: #f87171; font-size: 0.9rem; margin: 0.2rem 0; }
    .response-text { color: #e2e8f0; line-height: 1.7; }
    .response-text h1 { color: #7dd3fc; font-size: 1.5rem; margin: 1.2rem 0 0.5rem; }
    .response-text h2 { color: #93c5fd; font-size: 1.2rem; margin: 1rem 0 0.4rem; }
    .response-text h3 { color: #bae6fd; font-size: 1.05rem; margin: 0.8rem 0 0.3rem; }
    .response-text p { margin: 0.5rem 0; }
    .response-text code { background: #0f1117; padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.88em; color: #86efac; }
    .response-text pre { background: #0f1117; padding: 1rem; border-radius: 6px; overflow-x: auto; margin: 0.75rem 0; }
    .response-text pre code { background: none; padding: 0; }
    .response-text ul, .response-text ol { margin: 0.4rem 0 0.4rem 1.5rem; }
    .response-text li { margin: 0.2rem 0; }
    .response-text a { color: #7dd3fc; }
    .response-text blockquote { border-left: 3px solid #334155; padding-left: 1rem; color: #94a3b8; margin: 0.5rem 0; }
    .stats {
      background: #111827; border: 1px solid #1e3a5f; border-radius: 8px;
      padding: 0.8rem 1rem; margin-top: 1rem; font-size: 0.85rem; color: #64748b;
    }
    .stats strong { color: #7dd3fc; }
    .saved { color: #34d399; margin-top: 0.5rem; font-size: 0.88rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>&#128269; Claude Research Agent</h1>
      <p class="subtitle">Powered by claude-opus-4-6 &mdash; web search, web fetch &amp; code execution</p>
    </header>
    <div class="form">
      <input type="text" id="topic" placeholder="Enter a research topic&hellip;" />
      <select id="depth">
        <option value="quick">Quick</option>
        <option value="standard" selected>Standard</option>
        <option value="deep">Deep</option>
      </select>
      <button id="btn" onclick="startResearch()">Research</button>
    </div>
    <div class="output" id="output">
      <div class="placeholder">Enter a topic above to begin.</div>
    </div>
  </div>
  <script>
    let es = null;

    function startResearch() {
      const topic = document.getElementById('topic').value.trim();
      const depth = document.getElementById('depth').value;
      const btn = document.getElementById('btn');
      const output = document.getElementById('output');
      if (!topic) return;
      if (es) { es.close(); es = null; }

      btn.disabled = true;
      btn.textContent = 'Researching\u2026';
      output.innerHTML = '';

      let responseBuffer = '';
      let responseDiv = null;
      let thinkingDiv = null;

      function addLabel(text) {
        const el = document.createElement('div');
        el.className = 'section-label';
        el.textContent = text;
        output.appendChild(el);
      }

      function scroll() { output.scrollTop = output.scrollHeight; }

      es = new EventSource('/research?topic=' + encodeURIComponent(topic) + '&depth=' + depth);

      es.addEventListener('section', e => {
        const label = JSON.parse(e.data);
        const lower = label.toLowerCase();
        if (lower.includes('think')) {
          addLabel('Thinking');
          thinkingDiv = document.createElement('div');
          thinkingDiv.className = 'thinking-text';
          output.appendChild(thinkingDiv);
        } else if (lower.includes('response') || lower.includes('report')) {
          responseBuffer = '';
          addLabel('Report');
          responseDiv = document.createElement('div');
          responseDiv.className = 'response-text';
          output.appendChild(responseDiv);
        } else {
          addLabel(label);
        }
        scroll();
      });

      es.addEventListener('thinking', e => {
        if (thinkingDiv) { thinkingDiv.textContent += JSON.parse(e.data); scroll(); }
      });

      es.addEventListener('response', e => {
        responseBuffer += JSON.parse(e.data);
        if (responseDiv) { responseDiv.innerHTML = marked.parse(responseBuffer); scroll(); }
      });

      es.addEventListener('tool', e => {
        const el = document.createElement('div');
        el.className = 'tool-text';
        el.textContent = '\u26a1 ' + JSON.parse(e.data);
        output.appendChild(el); scroll();
      });

      es.addEventListener('status', e => {
        const el = document.createElement('div');
        el.className = 'status-text';
        el.textContent = JSON.parse(e.data);
        output.appendChild(el); scroll();
      });

      es.addEventListener('error_msg', e => {
        const el = document.createElement('div');
        el.className = 'error-text';
        el.textContent = '\u2717 ' + JSON.parse(e.data);
        output.appendChild(el); scroll();
      });

      es.addEventListener('stats', e => {
        const stats = JSON.parse(JSON.parse(e.data));
        const elapsed = ((Date.now() - new Date(stats.startTime).getTime()) / 1000).toFixed(1);
        const el = document.createElement('div');
        el.className = 'stats';
        el.innerHTML = '<strong>Research complete</strong> &mdash; ' +
          'Searches: ' + stats.searchesPerformed +
          ' &nbsp;|&nbsp; Pages: ' + stats.pagesVisited +
          ' &nbsp;|&nbsp; Code runs: ' + stats.codeExecutions +
          ' &nbsp;|&nbsp; Duration: ' + elapsed + 's';
        output.appendChild(el); scroll();
      });

      es.addEventListener('saved', e => {
        const el = document.createElement('div');
        el.className = 'saved';
        el.textContent = '\ud83d\udcc4 Report saved: ' + JSON.parse(e.data);
        output.appendChild(el); scroll();
      });

      es.addEventListener('file', e => {
        const el = document.createElement('div');
        el.className = 'saved';
        el.textContent = '\ud83d\udcbe File: ' + JSON.parse(e.data);
        output.appendChild(el); scroll();
      });

      es.addEventListener('done', () => {
        es.close(); es = null;
        btn.disabled = false; btn.textContent = 'Research';
      });

      es.onerror = () => {
        es.close(); es = null;
        btn.disabled = false; btn.textContent = 'Research';
      };
    }

    document.getElementById('topic').addEventListener('keydown', e => {
      if (e.key === 'Enter') startResearch();
    });
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
      banner: () => {},
      section: (label: string) => send("section", label),
      thinking: (text: string) => send("thinking", text),
      response: (text: string) => send("response", text),
      toolCall: (name: string, detail: string) => send("tool", `[${name}] ${detail}`),
      toolResult: () => {},
      codeRun: (snippet: string) => send("tool", `[code] ${snippet}`),
      codeOutput: (stdout: string, stderr: string, _exitCode: number) => {
        if (stdout) send("response", stdout);
        if (stderr) send("error_msg", stderr);
      },
      fileSaved: (name: string, dest: string) => send("file", `${name} \u2192 ${dest}`),
      status: (msg: string) => send("status", msg),
      stats: (session: unknown) => send("stats", JSON.stringify(session)),
      error: (msg: string) => send("error_msg", msg),
      saved: (filePath: string) => send("saved", filePath),
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
  console.log(`\nResearch Agent UI → http://localhost:${PORT}\n`);
});
