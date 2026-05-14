import { useState, useEffect, useCallback } from 'react'
import { ownerFetch } from '../../lib/auth'

export default function OwnerDetection() {
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await ownerFetch('/api/owner/detection-log')
    if (res.ok) setLog(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = filter === 'all' ? log : log.filter(r => r.outcome === filter)

  const counts = log.reduce((acc, r) => {
    acc[r.outcome] = (acc[r.outcome] || 0) + 1
    return acc
  }, {})

  return (
    <div className="db-page">
      <div className="db-page-h">
        <h1 className="db-page-title">Detection log</h1>
        <p className="db-page-desc">Every domain probed by the auto-detection scheduler, with outcome and score.</p>
      </div>

      <div className="db-filter-row">
        {['all', 'fasttrack', 'pending', 'dead', 'clean'].map(f => (
          <button
            key={f}
            className={`db-filter-btn ${filter === f ? 'is-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? `All (${log.length})` : `${f} (${counts[f] || 0})`}
          </button>
        ))}
        <button className="db-btn db-btn--sm" style={{ marginLeft: 'auto' }} onClick={load}>Refresh</button>
      </div>

      {loading ? <div className="db-loading">Loading…</div> : (
        <div className="db-table">
          <div className="dbt-head dbt-row dbt-row--5">
            <span>Domain</span><span>Outcome</span><span>Score</span><span>Keywords matched</span><span>Time</span>
          </div>
          {filtered.map((r, i) => (
            <div key={i} className="dbt-row dbt-row--5">
              <span className="dbt-domain">{r.domain}</span>
              <span><span className={`db-pill db-pill--${r.outcome}`}>{r.outcome}</span></span>
              <span>{r.ai_score ?? '—'}</span>
              <span className="dbt-mute">{r.matched_keywords ? JSON.parse(r.matched_keywords).join(', ') : '—'}</span>
              <span className="dbt-mute">{new Date(r.ran_at).toLocaleString()}</span>
            </div>
          ))}
          {filtered.length === 0 && <div className="db-empty">No entries for this filter.</div>}
        </div>
      )}
    </div>
  )
}
