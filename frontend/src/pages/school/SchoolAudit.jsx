import { useState } from 'react'
import { schoolFetch } from '../../lib/auth'

const STEPS = ['Method', 'Options', 'Instructions', 'Results']

export default function SchoolAudit() {
  const [step, setStep] = useState(0)
  const [method, setMethod] = useState('')
  const [size, setSize] = useState('standard')
  const [session, setSession] = useState(null)
  const [result, setResult] = useState(null)
  const [polling, setPolling] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setError('')
    try {
      const sizeMap = { quick: 'top50', standard: 'top100', full: 'full' }
      const res = await fetch(`/api/audit/start?size=${sizeMap[size] || 'top100'}&method=${method}`)
      if (!res.ok) throw new Error('Failed')
      const d = await res.json()
      setSession(d)
      setStep(2)
    } catch {
      setError('Could not start audit session. Please try again.')
    }
  }

  async function checkResult() {
    if (!session?.token) return
    setPolling(true); setError('')
    try {
      const res = await fetch(`/api/audit/result/${session.token}`)
      const d = await res.json()
      if (d.status === 'pending') { setError('Results not in yet — try again in a moment.') }
      else { setResult(d); setStep(3) }
    } catch { setError('Error fetching results.') }
    setPolling(false)
  }

  function reset() { setStep(0); setMethod(''); setSize('standard'); setSession(null); setResult(null); setError('') }

  const pct = result?.score ?? 0
  const blockedCount = result?.blocked ?? 0
  const total = result?.total ?? 0

  return (
    <div className="db-page">
      <div className="db-page-h">
        <h1 className="db-page-title">Audit tool</h1>
        <p className="db-page-desc">Test your network filter against the current SchoolBlock list.</p>
      </div>

      <div className="audit-stepper">
        {STEPS.map((s, i) => (
          <div key={s} className={`ast-step ${i === step ? 'is-active' : ''} ${i < step ? 'is-done' : ''}`}>
            <span className="ast-num">{i < step ? '✓' : i + 1}</span>
            <span className="ast-label">{s}</span>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="audit-panel">
          <h2 className="ap-h">How do you want to run the audit?</h2>
          <div className="ap-options">
            {[
              { id: 'console', label: 'Browser console', desc: 'Paste a script into DevTools — works on any browser, no install.' },
              { id: 'bookmarklet', label: 'Bookmarklet', desc: 'Click a saved bookmark on any page to trigger the test.' },
              { id: 'curl', label: 'cURL / server', desc: 'Run from the command line or a server — best for IT staff.' },
            ].map(opt => (
              <button
                key={opt.id}
                className={`ap-option ${method === opt.id ? 'is-selected' : ''}`}
                onClick={() => setMethod(opt.id)}
              >
                <div className="apo-label">{opt.label}</div>
                <div className="apo-desc">{opt.desc}</div>
              </button>
            ))}
          </div>
          <button className="db-btn db-btn--accent ap-next" disabled={!method} onClick={() => setStep(1)}>Next →</button>
        </div>
      )}

      {step === 1 && (
        <div className="audit-panel">
          <h2 className="ap-h">Audit size</h2>
          <div className="ap-options">
            {[
              { id: 'quick', label: 'Quick (50 domains)', desc: 'Fast spot check — good for regular monitoring.' },
              { id: 'standard', label: 'Standard (200 domains)', desc: 'Representative sample of the full list.' },
              { id: 'full', label: 'Full list', desc: 'Complete audit — may take a few minutes.' },
            ].map(opt => (
              <button
                key={opt.id}
                className={`ap-option ${size === opt.id ? 'is-selected' : ''}`}
                onClick={() => setSize(opt.id)}
              >
                <div className="apo-label">{opt.label}</div>
                <div className="apo-desc">{opt.desc}</div>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button className="db-btn" onClick={() => setStep(0)}>← Back</button>
            <button className="db-btn db-btn--accent" onClick={generate}>Generate audit →</button>
          </div>
          {error && <div className="db-error">{error}</div>}
        </div>
      )}

      {step === 2 && session && (
        <div className="audit-panel">
          <h2 className="ap-h">Run the audit</h2>
          <p className="ap-desc">Copy and run the script below on your school network, then check results here.</p>
          <div className="ap-script-wrap">
            <pre className="ap-script">{session.script}</pre>
            <button className="ap-copy" onClick={() => navigator.clipboard.writeText(session.script)}>Copy</button>
          </div>
          <p className="ap-hint">After running, wait a few seconds then click below.</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button className="db-btn" onClick={() => setStep(1)}>← Back</button>
            <button className="db-btn db-btn--accent" disabled={polling} onClick={checkResult}>
              {polling ? 'Checking…' : 'Check results →'}
            </button>
          </div>
          {error && <div className="db-error">{error}</div>}
        </div>
      )}

      {step === 3 && result && (
        <div className="audit-panel">
          <h2 className="ap-h">Audit results</h2>
          <div className="ap-score-row">
            <div className="ap-score-big">{pct}%</div>
            <div className="ap-score-meta">
              <div><b>{blockedCount}</b> of {total} domains blocked</div>
              <div className={`ap-grade ap-grade--${pct >= 90 ? 'a' : pct >= 70 ? 'b' : pct >= 50 ? 'c' : 'd'}`}>
                Grade {pct >= 90 ? 'A' : pct >= 70 ? 'B' : pct >= 50 ? 'C' : 'D'}
              </div>
            </div>
          </div>
          {result.unblockedDomains?.length > 0 && (
            <div className="db-table" style={{ marginTop: '24px' }}>
              <div className="db-section-h" style={{ padding: '10px 16px' }}>Not blocked ({result.unblockedDomains.length})</div>
              {result.unblockedDomains.map(d => (
                <div key={d.domain} className="dbt-row">
                  <span className="dbt-domain">{d.domain}</span>
                  <span><span className="db-pill db-pill--reject">Not blocked</span></span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button className="db-btn" onClick={reset}>New audit</button>
          </div>
        </div>
      )}
    </div>
  )
}
