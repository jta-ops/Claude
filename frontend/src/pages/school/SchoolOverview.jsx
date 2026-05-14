import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { schoolFetch } from '../../lib/auth'

function StatCard({ label, value }) {
  return (
    <div className="db-stat">
      <div className="dbs-v">{value ?? '—'}</div>
      <div className="dbs-k">{label}</div>
    </div>
  )
}

export default function SchoolOverview() {
  const [data, setData] = useState(null)
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      schoolFetch('/api/school/overview').then(r => r.ok ? r.json() : null),
      schoolFetch('/api/school/audits').then(r => r.ok ? r.json() : []),
    ]).then(([d, a]) => { setData(d); setAudits((a || []).slice(0, 5)); setLoading(false) })
  }, [])

  if (loading) return <div className="db-loading">Loading…</div>
  if (!data) return <div className="db-loading">Could not load overview.</div>

  return (
    <div className="db-page">
      <div className="db-page-h">
        <h1 className="db-page-title">Overview</h1>
        <p className="db-page-desc">Your school's activity at a glance.</p>
      </div>

      <div className="db-stats-grid">
        <StatCard label="Domains on list"    value={data.totalDomains?.toLocaleString()} />
        <StatCard label="Team members"       value={data.userCount} />
        <StatCard label="Submissions"        value={data.pendingSubmissions} />
        <StatCard label="Last score"         value={data.lastAudit?.score != null ? `${data.lastAudit.score}%` : '—'} />
      </div>

      <div className="db-section" style={{ marginTop: '40px' }}>
        <div className="db-section-h">Recent audits</div>
        <div className="db-table">
          <div className="dbt-head dbt-row">
            <span>Token</span><span>Size</span><span>Score</span><span>Date</span>
          </div>
          {audits.map(a => (
            <div key={a.token} className="dbt-row">
              <span className="dbt-domain" style={{ fontSize: '12px' }}>{a.token?.slice(0, 12)}…</span>
              <span>{a.listSize || '—'}</span>
              <span>{a.score != null ? `${a.score}%` : 'Pending'}</span>
              <span className="dbt-mute">{new Date(a.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {audits.length === 0 && <div className="db-empty">No audits yet. <Link to="/dashboard/audit">Run your first audit →</Link></div>}
        </div>
      </div>

      <div className="db-quick-links">
        <Link className="dql-btn" to="/dashboard/audit">Run an audit →</Link>
        <Link className="dql-btn" to="/dashboard/downloads">Download blocklist →</Link>
        <Link className="dql-btn dql-btn--ghost" to="/dashboard/submit">Submit a domain →</Link>
      </div>
    </div>
  )
}
