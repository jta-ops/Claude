import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { ownerFetch } from '../../lib/auth'

function QueueItem({ item, onApprove, onReject, busy }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`qi-card ${open ? 'is-open' : ''}`}>
      <div className="qi-row" onClick={() => setOpen(o => !o)}>
        <span className="qi-domain">{item.domain}</span>
        <span className="qi-cat">{item.category || '—'}</span>
        <span className={`db-pill db-pill--${item.source === 'auto' ? 'auto' : 'sub'}`}>{item.source === 'auto' ? 'Auto-detected' : 'Submission'}</span>
        {item.ai_score != null && <span className="qi-score">Score {item.ai_score}</span>}
        <span className="qi-time">{new Date(item.submitted_at || item.created_at).toLocaleDateString()}</span>
        <span className="qi-chevron">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="qi-detail">
          {item.submitter_email && <div className="qi-meta"><b>Submitted by:</b> {item.submitter_email}</div>}
          {item.notes && <div className="qi-meta"><b>Notes:</b> {item.notes}</div>}
          {item.matched_keywords?.length > 0 && (
            <div className="qi-meta"><b>Matched keywords:</b> {item.matched_keywords.join(', ')}</div>
          )}
          {item.detection_method && <div className="qi-meta"><b>Detection:</b> {item.detection_method}</div>}
          <div className="qi-actions">
            <button className="qi-btn qi-btn--approve" disabled={busy} onClick={() => onApprove(item.id)}>Approve →</button>
            <button className="qi-btn qi-btn--reject" disabled={busy} onClick={() => onReject(item.id)}>Reject</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OwnerQueue({ onApprove: notifyParent }) {
  const { type } = useParams()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await ownerFetch(`/api/owner/queue/${type}`)
      if (res.ok) setItems(await res.json())
    } finally { setLoading(false) }
  }, [type])

  useEffect(() => { load() }, [load])

  async function approve(id) {
    setBusy(true); setMsg('')
    const res = await ownerFetch(`/api/owner/queue/${id}/approve`, { method: 'POST' })
    if (res.ok) { setMsg('Domain approved and added to list.'); load(); notifyParent?.() }
    else { const d = await res.json(); setMsg(d.error || 'Error') }
    setBusy(false)
  }

  async function reject(id) {
    setBusy(true); setMsg('')
    const res = await ownerFetch(`/api/owner/queue/${id}/reject`, { method: 'POST' })
    if (res.ok) { setMsg('Entry rejected.'); load(); notifyParent?.() }
    else { const d = await res.json(); setMsg(d.error || 'Error') }
    setBusy(false)
  }

  const title = type === 'fasttrack' ? 'Fast-track queue' : 'Normal review queue'
  const desc  = type === 'fasttrack'
    ? 'High-confidence auto-detections and high-score submissions — review quickly.'
    : 'Lower-confidence detections and manual submissions awaiting review.'

  return (
    <div className="db-page">
      <div className="db-page-h">
        <h1 className="db-page-title">{title}</h1>
        <p className="db-page-desc">{desc}</p>
      </div>
      {msg && <div className="db-notice">{msg}</div>}
      {loading ? (
        <div className="db-loading">Loading…</div>
      ) : items.length === 0 ? (
        <div className="db-empty-state">
          <div className="db-empty-icon">✓</div>
          <div className="db-empty-msg">Queue is empty — nothing to review.</div>
        </div>
      ) : (
        <div className="qi-list">
          {items.map(item => (
            <QueueItem key={item.id} item={item} onApprove={approve} onReject={reject} busy={busy} />
          ))}
        </div>
      )}
    </div>
  )
}
