import { useState, useEffect } from 'react'
import { schoolFetch } from '../../lib/auth'

export default function SchoolHistory() {
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    schoolFetch('/api/school/audits')
      .then(r => r.ok ? r.json() : [])
      .then(d => { setAudits(d); setLoading(false) })
  }, [])

  async function viewDetail(token) {
    setSelected(token); setLoadingDetail(true); setDetail(null)
    const res = await fetch(`/api/audit/result/${token}`)
    if (res.ok) setDetail(await res.json())
    setLoadingDetail(false)
  }

  function exportCSV(d) {
    const rows = [['domain', 'status'], ...(d.unblockedDomains || []).map(r => [r.domain, 'not_blocked'])]
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `audit-${selected}.csv`
    a.click()
  }

  return (
    <div className="db-page">
      <div className="db-page-h">
        <h1 className="db-page-title">Audit history</h1>
        <p className="db-page-desc">Past audit sessions for your school.</p>
      </div>

      {loading ? <div className="db-loading">Loading…</div> : (
        <div className="db-split">
          <div className="db-split-list">
            <div className="db-table">
              <div className="dbt-head dbt-row">
                <span>Date</span><span>Size</span><span>Score</span>
              </div>
              {audits.map(a => (
                <div
                  key={a.token}
                  className={`dbt-row dbt-row--link ${selected === a.token ? 'is-selected' : ''}`}
                  onClick={() => viewDetail(a.token)}
                >
                  <span className="dbt-mute">{new Date(a.createdAt).toLocaleDateString()}</span>
                  <span>{a.listSize || '—'}</span>
                  <span>{a.score != null ? `${a.score}%` : 'Pending'}</span>
                </div>
              ))}
              {audits.length === 0 && <div className="db-empty">No audits yet.</div>}
            </div>
          </div>

          {selected && (
            <div className="db-split-detail">
              {loadingDetail ? <div className="db-loading">Loading…</div> : detail ? (
                <>
                  <div className="db-detail-toolbar">
                    <button className="db-btn db-btn--sm" onClick={() => exportCSV(detail)}>Export CSV</button>
                  </div>
                  <div className="ap-score-row ap-score-row--sm">
                    <div className="ap-score-big ap-score-big--sm">{detail.score ?? 0}%</div>
                    <div className="ap-score-meta">
                      {detail.blocked} / {detail.total} blocked · Grade {detail.grade}
                    </div>
                  </div>
                  {detail.unblockedDomains?.length > 0 && (
                    <div className="db-table">
                      <div className="db-section-h" style={{ padding: '8px 14px', fontSize: '10px' }}>Not blocked ({detail.unblockedDomains.length})</div>
                      {detail.unblockedDomains.map(d => (
                        <div key={d.domain} className="dbt-row">
                          <span className="dbt-domain">{d.domain}</span>
                          <span><span className="db-pill db-pill--reject">Not blocked</span></span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : <div className="db-empty">No result data available.</div>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
