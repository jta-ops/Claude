import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Masthead from '../components/Masthead'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

const GRADE_COLOURS = { A: '#0e6e4f', B: '#2d6a9f', C: '#b87d1b', D: '#b84a1b', F: '#7a2518' }

function GradeDisplay({ score, grade }) {
  const colour = GRADE_COLOURS[grade] || '#7a2518'
  return (
    <div className="grade-display">
      <div className="gd-grade" style={{ color: colour }}>{grade}</div>
      <div className="gd-score">{score}<span className="gd-denom">/100</span></div>
      <div className="gd-label">domains blocked</div>
    </div>
  )
}

function exportCSV(data) {
  const rows = [
    ['Domain', 'Category', 'Status'],
    ...((data.unblockedDomains || []).map(d => [d.domain || d, d.category || '', 'Not blocked'])),
  ]
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `schoolblock-audit-${data.token}.csv`
  a.click()
}

function printPage() {
  window.print()
}

export default function ScorecardPage() {
  const { token } = useParams()
  const [state, setState] = useState('loading')
  const [data, setData] = useState(null)
  const [polls, setPolls] = useState(0)

  useEffect(() => {
    if (!token) { setState('notfound'); return }
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch(`/api/audit/result/${token}`)
        if (cancelled) return

        if (res.status === 404) { setState('notfound'); return }

        const json = await res.json()

        if (res.status === 202 || json.status === 'pending') {
          setState('pending')
          if (polls < 20) {
            setTimeout(() => { if (!cancelled) setPolls(p => p + 1) }, 4000)
          }
          return
        }

        setData(json)
        setState('ready')
      } catch {
        setState('error')
      }
    }

    poll()
    return () => { cancelled = true }
  }, [token, polls])

  if (state === 'loading' || state === 'pending') {
    return (
      <>
        <Masthead />
        <Nav />
        <main className="shell">
          <div className="scorecard-wait">
            <div className="sw-spinner" />
            <div className="sw-h">
              {state === 'loading' ? 'Loading scorecard…' : 'Waiting for audit results…'}
            </div>
            <p className="sw-body">
              {state === 'pending'
                ? 'The audit script is still running. This page refreshes automatically every 4 seconds.'
                : 'Fetching your results.'}
            </p>
            <div className="sw-token">Token: <code>{token}</code></div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (state === 'notfound') {
    return (
      <>
        <Masthead />
        <Nav />
        <main className="shell">
          <div className="scorecard-wait">
            <div className="sw-h">Session not found</div>
            <p className="sw-body">Token <code>{token}</code> doesn't match any audit session. Check the token and try again.</p>
            <Link className="rp-btn" to="/audit">← Back to audit tool</Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (state === 'error' || !data) {
    return (
      <>
        <Masthead />
        <Nav />
        <main className="shell">
          <div className="scorecard-wait">
            <div className="sw-h">Could not load results</div>
            <p className="sw-body">There was a problem fetching your scorecard. <button className="sf-submit" style={{display:'inline',padding:'8px 16px',fontSize:'12px'}} onClick={() => { setState('loading'); setPolls(p => p+1) }}>Try again</button></p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const recentlyAdded = (data.unblockedDomains || []).filter(d => d.isRecent || false)
  const colour = GRADE_COLOURS[data.grade] || '#7a2518'

  return (
    <>
      <Masthead />
      <Nav />
      <main className="shell">
        <section className="scorecard-header">
          <div className="hero-eyebrow">
            <span className="eb-num">Audit Scorecard</span>
            <span className="eb-rule" />
            <span className="eb-meta">Token: {token}</span>
          </div>
          <h1 className="hero-h" style={{ fontSize: 'clamp(40px, 5vw, 80px)' }}>
            Your network is blocking <span className="hero-em" style={{ color: colour }}>{data.score}%</span> of the list.
          </h1>
        </section>

        <div className="score-summary">
          <GradeDisplay score={data.score} grade={data.grade} />
          <div className="ss-stats">
            <div className="ss-stat ss-stat--good">
              <div className="sss-v">{data.blocked}</div>
              <div className="sss-k">Blocked</div>
              <div className="sss-foot">Your filter is catching these</div>
            </div>
            <div className="ss-stat ss-stat--bad">
              <div className="sss-v">{data.unblocked}</div>
              <div className="sss-k">Getting through</div>
              <div className="sss-foot">Action recommended</div>
            </div>
            <div className="ss-stat">
              <div className="sss-v">{data.total}</div>
              <div className="sss-k">Total tested</div>
              <div className="sss-foot">From your selected list size</div>
            </div>
          </div>

          {recentlyAdded.length > 0 && (
            <div className="urgency-flag">
              <span className="uf-dot">!</span>
              <span className="uf-text">
                <strong>{recentlyAdded.length} of these</strong> were added to the blocklist this month — your filter is out of date.
              </span>
            </div>
          )}
        </div>

        {data.unblocked > 0 && (
          <section className="sc-section">
            <div className="section-head">
              <div className="sh-left">
                <h2 className="sh-h" style={{ fontSize: 'clamp(24px, 2.5vw, 36px)' }}>
                  Sites getting through your filter.
                </h2>
              </div>
              <div className="sh-right">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="sh-btn" onClick={() => exportCSV(data)}>Export CSV</button>
                  <button className="sh-btn sh-btn--ghost" onClick={printPage}>Print / PDF</button>
                </div>
              </div>
            </div>

            <div className="list-table">
              <div className="lt-head sc-row">
                <div className="lt-c lt-c--num">#</div>
                <div className="lt-c lt-c--domain">Domain</div>
                <div className="lt-c lt-c--cat">Category</div>
                <div className="lt-c lt-c--age">On list since</div>
                <div className="lt-c">Urgency</div>
              </div>
              {(data.unblockedDomains || []).map((d, i) => {
                const domain = typeof d === 'string' ? d : d.domain
                const cat    = d.category || '—'
                const since  = d.since || '—'
                const urgent = d.isRecent || false
                return (
                  <div key={domain} className="lt-row sc-row">
                    <div className="lt-c lt-c--num">{String(i + 1).padStart(3, '0')}</div>
                    <div className="lt-c lt-c--domain"><span className="dom">{domain}</span></div>
                    <div className="lt-c lt-c--cat">{cat !== '—' ? <span className={`cat-badge cat-${cat.toLowerCase()}`}>{cat}</span> : '—'}</div>
                    <div className="lt-c lt-c--age">{since}</div>
                    <div className="lt-c">
                      {urgent
                        ? <span className="urgency-pill urgency-pill--hot">New this month</span>
                        : <span className="urgency-pill">Update filter</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {data.unblocked === 0 && (
          <div className="scorecard-perfect">
            <div className="sp-mark">✓</div>
            <div className="sp-h">All tested domains are blocked.</div>
            <p className="sp-body">Your filter is catching everything in the tested set. Run the full list for complete coverage.</p>
          </div>
        )}

        <div className="sc-actions">
          <a className="sca-btn sca-btn--primary" href="/api/list/current.txt" download>
            Download updated blocklist ↓
          </a>
          <Link className="sca-btn" to="/audit">
            Run another audit →
          </Link>
          <button className="sca-btn" onClick={printPage}>
            Print for your principal / board
          </button>
        </div>

        <div className="sc-footer-note">
          <span>Audit conducted against SchoolBlock blocklist · Issue 142 · schoolblock.codexyy.dev</span>
        </div>
      </main>
      <Footer />
    </>
  )
}
