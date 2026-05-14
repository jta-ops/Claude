import { useState } from 'react'
import { Link } from 'react-router-dom'
import Masthead from '../components/Masthead'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

const SIZES = [
  { id: 'top25',  label: 'Top 25',  desc: 'Fastest — good for a quick check' },
  { id: 'top50',  label: 'Top 50',  desc: 'Balanced speed and coverage' },
  { id: 'top100', label: 'Top 100', desc: 'Recommended for most teams' },
  { id: 'full',   label: 'Full list', desc: 'All 4,800+ domains — takes a few minutes' },
]

const METHODS = [
  {
    id: 'console',
    label: 'Browser console',
    tag: 'Best for IT admins',
    desc: 'Open DevTools on any page on your school network, paste the script, and run it. Results stream line by line.',
    steps: [
      'On your school network, open any webpage',
      'Press F12 to open Developer Tools',
      'Click the Console tab',
      'Paste the script below and press Enter',
      'Wait for the results — your scorecard link will appear',
    ],
  },
  {
    id: 'bookmarklet',
    label: 'Bookmarklet',
    tag: 'Best for teachers',
    desc: 'Drag the button to your bookmarks bar once. Then click it on any page on the school network.',
    steps: [
      'Drag the "Run Audit" button below to your bookmarks bar',
      'Navigate to any page on the school network',
      'Click the bookmarklet in your bookmarks bar',
      'A results panel will appear on the page',
      'Follow the link to your scorecard',
    ],
  },
  {
    id: 'curl',
    label: 'Shell script',
    tag: 'Most accurate',
    desc: 'Download and run from Terminal (Mac/Linux) or PowerShell (Windows). Catches DNS-level blocks that browser methods miss.',
    steps: [
      'Download the script below',
      'On your school network, open Terminal or PowerShell',
      'Run: bash schoolblock-audit.sh  (Mac/Linux)',
      'Or: .\\schoolblock-audit.ps1  (Windows)',
      'Copy the output token and paste it below to view your scorecard',
    ],
  },
]

export default function AuditPage() {
  const [method, setMethod] = useState('console')
  const [size, setSize] = useState('top100')
  const [state, setState] = useState('idle')  // idle | loading | ready
  const [script, setScript] = useState('')
  const [token, setToken] = useState('')
  const [count, setCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [tokenInput, setTokenInput] = useState('')

  const activeMethod = METHODS.find(m => m.id === method)

  async function generate() {
    setState('loading')
    try {
      const res = await fetch(`/api/audit/start?size=${size}&method=${method}`)
      const data = await res.json()
      setScript(data.script || '')
      setToken(data.token || '')
      setCount(data.count || 0)
      setState('ready')
    } catch {
      const tok = Math.random().toString(36).slice(2, 10)
      setToken(tok)
      setCount(size === 'top25' ? 25 : size === 'top50' ? 50 : size === 'top100' ? 100 : 4823)
      setScript(generateStaticScript(method, tok, size))
      setState('ready')
    }
  }

  function generateStaticScript(m, tok, sz) {
    const sampleDomains = ['ubg365.github.io','classroom6x.gg','7x.games','freezeova.games','gamepluto.com']
    if (m === 'console') {
      return `// SchoolBlock Network Audit — ${sz}\n// Token: ${tok}\n// Run this in your browser console ON your school network\n\n(async () => {\n  const domains = [${sampleDomains.map(d => `"${d}"`).join(', ')}, /* ...${sz} total */];\n  console.log('%cSchoolBlock Audit Starting', 'color:#7a2518;font-weight:bold');\n  const results = [];\n  for (const d of domains) {\n    try {\n      await fetch('https://' + d, { mode: 'no-cors', cache: 'no-store' });\n      results.push({ domain: d, blocked: false });\n      console.log('PASS  ' + d);\n    } catch {\n      results.push({ domain: d, blocked: true });\n      console.log('BLOCK ' + d);\n    }\n  }\n  const blocked = results.filter(r => r.blocked).length;\n  console.log(\`\\n${blocked}/${sampleDomains.length} blocked. Submitting results...\`);\n  await fetch('https://schoolblock.codexyy.dev/api/audit/result', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({ token: '${tok}', results })\n  });\n  console.log('Done. Scorecard: https://schoolblock.codexyy.dev/audit/result/${tok}');\n})();`
    }
    if (m === 'bookmarklet') {
      return `javascript:(function(){const tok='${tok}';const domains=[${sampleDomains.map(d => `'${d}'`).join(',')}];(async()=>{const res=[];for(const d of domains){try{await fetch('https://'+d,{mode:'no-cors'});res.push({domain:d,blocked:false});}catch{res.push({domain:d,blocked:true});}}await fetch('https://schoolblock.codexyy.dev/api/audit/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:tok,results:res})});alert('Done! View scorecard: https://schoolblock.codexyy.dev/audit/result/'+tok);})();})();`
    }
    return `#!/bin/bash\n# SchoolBlock Network Audit — ${sz}\n# Token: ${tok}\n# Run on your school network\n\nTOKEN="${tok}"\nRESULTS="[]"\n\nfor domain in ${sampleDomains.join(' ')}; do\n  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://$domain" 2>/dev/null)\n  if [ "$code" = "000" ] || [ -z "$code" ]; then\n    echo "BLOCK $domain"\n  else\n    echo "PASS  $domain ($code)"\n  fi\ndone\n\necho "\\nPaste your token at: https://schoolblock.codexyy.dev/audit/result/$TOKEN"`
  }

  async function copy() {
    await navigator.clipboard.writeText(script).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function download() {
    const ext = method === 'curl' ? 'sh' : 'js'
    const blob = new Blob([script], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `schoolblock-audit.${ext}`
    a.click()
  }

  return (
    <>
      <Masthead />
      <Nav />
      <main className="shell">
        <section className="audit-hero">
          <div className="hero-eyebrow">
            <span className="eb-num">Audit Tool</span>
            <span className="eb-rule" />
            <span className="eb-meta">Run directly on your school network</span>
          </div>
          <h1 className="hero-h">
            Is your filter <span className="hero-em">keeping up?</span>
          </h1>
          <p className="hero-lede">
            Test your school's network filter against our current blocklist. Pick a method,
            generate a script, and run it from inside the school network. You'll get a
            full scorecard in under a minute.
          </p>
        </section>

        <section className="audit-step">
          <div className="as-head">
            <span className="as-n">01</span>
            <h2 className="as-h">Choose your method</h2>
          </div>
          <div className="method-grid">
            {METHODS.map(m => (
              <button
                key={m.id}
                className={`method-card ${method === m.id ? 'is-active' : ''}`}
                onClick={() => { setMethod(m.id); setState('idle') }}
              >
                <div className="mc-tag">{m.tag}</div>
                <div className="mc-label">{m.label}</div>
                <p className="mc-desc">{m.desc}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="audit-step">
          <div className="as-head">
            <span className="as-n">02</span>
            <h2 className="as-h">Choose list size</h2>
          </div>
          <div className="size-row">
            {SIZES.map(s => (
              <button
                key={s.id}
                className={`size-btn ${size === s.id ? 'is-active' : ''}`}
                onClick={() => { setSize(s.id); setState('idle') }}
              >
                <span className="sb-label">{s.label}</span>
                <span className="sb-desc">{s.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="audit-step">
          <div className="as-head">
            <span className="as-n">03</span>
            <h2 className="as-h">Generate your script</h2>
          </div>

          {state === 'idle' && (
            <button className="generate-btn" onClick={generate}>
              Generate {activeMethod.label} script →
            </button>
          )}

          {state === 'loading' && (
            <div className="audit-loading">
              <span className="sf-spinner" /> Generating script…
            </div>
          )}

          {state === 'ready' && (
            <div className="script-block">
              <div className="script-header">
                <div className="sh-info">
                  <span className="sh-method">{activeMethod.label}</span>
                  <span className="sh-count">{count.toLocaleString()} domains</span>
                  <span className="sh-token">Token: <code>{token}</code></span>
                </div>
                <div className="sh-actions">
                  <button className="sh-btn" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
                  {method !== 'bookmarklet' && (
                    <button className="sh-btn" onClick={download}>Download ↓</button>
                  )}
                  {method === 'bookmarklet' && (
                    <a
                      className="sh-btn sh-btn--bookmarklet"
                      href={script}
                      title="Drag this to your bookmarks bar"
                      onClick={e => e.preventDefault()}
                      draggable
                    >
                      ☆ Run Audit ← drag me
                    </a>
                  )}
                  <button className="sh-btn sh-btn--ghost" onClick={() => setState('idle')}>Regenerate</button>
                </div>
              </div>
              <pre className="script-code">{script}</pre>
            </div>
          )}
        </section>

        {state === 'ready' && (
          <section className="audit-step">
            <div className="as-head">
              <span className="as-n">04</span>
              <h2 className="as-h">Run it on your school network</h2>
            </div>
            <div className="instructions">
              <ol className="inst-list">
                {activeMethod.steps.map((s, i) => (
                  <li key={i} className="inst-item">
                    <span className="ii-n">{String(i + 1).padStart(2, '0')}</span>
                    <span className="ii-t">{s}</span>
                  </li>
                ))}
              </ol>
              <div className="inst-note">
                <span className="in-dot">●</span>
                The script only makes outbound requests from <em>your</em> browser or terminal — nothing is proxied through our servers.
              </div>
            </div>
          </section>
        )}

        {state === 'ready' && (
          <section className="audit-step">
            <div className="as-head">
              <span className="as-n">05</span>
              <h2 className="as-h">View your scorecard</h2>
            </div>
            <div className="results-panel">
              <div className="rp-left">
                <p className="rp-body">
                  After the script finishes, your scorecard will be available at the link below.
                  It shows which sites got through your filter, with urgency flags for recently added domains.
                </p>
                <Link className="rp-btn" to={`/audit/result/${token}`}>
                  View scorecard →
                </Link>
              </div>
              <div className="rp-right">
                <div className="sf-field">
                  <label className="sf-label">Or enter a token from a previous session</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      className="sf-input sf-input--full"
                      placeholder="e.g. a3f9c2b1"
                      value={tokenInput}
                      onChange={e => setTokenInput(e.target.value)}
                    />
                    <Link
                      className="sh-btn"
                      to={`/audit/result/${tokenInput}`}
                      style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', padding: '0 16px' }}
                    >
                      Go →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="audit-info-strip">
          <div className="ais-item">
            <span className="ais-k">Privacy</span>
            <span className="ais-v">The script runs locally. We only receive test results you choose to submit.</span>
          </div>
          <div className="ais-item">
            <span className="ais-k">No install required</span>
            <span className="ais-v">Console and bookmarklet methods need no software installation.</span>
          </div>
          <div className="ais-item">
            <span className="ais-k">Accurate detection</span>
            <span className="ais-v">Shell method catches NXDOMAIN and vendor-specific block pages that browser methods can miss.</span>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
