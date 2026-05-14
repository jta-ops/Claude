import { useState, useEffect, useCallback } from 'react'
import { ownerFetch } from '../../lib/auth'

function SignupCard({ s, onApprove, onReject, busy }) {
  const [open, setOpen] = useState(false)
  const [initPass, setInitPass] = useState('')
  return (
    <div className={`qi-card ${open ? 'is-open' : ''}`}>
      <div className="qi-row" onClick={() => setOpen(o => !o)}>
        <span className="qi-domain">{s.school_name}</span>
        <span className="qi-cat">{s.country}{s.region ? `, ${s.region}` : ''}</span>
        <span className="qi-cat">{s.contact_email}</span>
        <span className="qi-time">{new Date(s.created_at).toLocaleDateString()}</span>
        <span className="qi-chevron">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="qi-detail">
          {s.contact_name  && <div className="qi-meta"><b>Contact:</b> {s.contact_name}</div>}
          {s.contact_phone && <div className="qi-meta"><b>Phone:</b> {s.contact_phone}</div>}
          {s.student_count && <div className="qi-meta"><b>Students:</b> {s.student_count.toLocaleString()}</div>}
          {s.reason        && <div className="qi-meta"><b>Reason:</b> {s.reason}</div>}
          <div className="qi-approve-row">
            <input
              className="sf-input"
              placeholder="Set initial password for school admin"
              type="password"
              value={initPass}
              onChange={e => setInitPass(e.target.value)}
            />
            <button className="qi-btn qi-btn--approve" disabled={busy || !initPass.trim()} onClick={() => onApprove(s.id, initPass)}>
              Approve &amp; create account →
            </button>
            <button className="qi-btn qi-btn--reject" disabled={busy} onClick={() => onReject(s.id)}>Reject</button>
          </div>
        </div>
      )}
    </div>
  )
}

function SchoolRow({ s }) {
  return (
    <div className="dbt-row">
      <span>{s.name}</span>
      <span>{s.country || '—'}{s.region ? `, ${s.region}` : ''}</span>
      <span>{s.user_count ?? '—'} users</span>
      <span className="dbt-mute">{new Date(s.approved_at).toLocaleDateString()}</span>
    </div>
  )
}

export default function OwnerSchools({ onAction }) {
  const [signups, setSignups] = useState([])
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [sRes, aRes] = await Promise.all([
      ownerFetch('/api/owner/signups'),
      ownerFetch('/api/owner/schools'),
    ])
    if (sRes.ok) setSignups(await sRes.json())
    if (aRes.ok) setSchools(await aRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function approve(id, password) {
    setBusy(true); setMsg('')
    const res = await ownerFetch(`/api/owner/signups/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    })
    const d = await res.json()
    if (res.ok) { setMsg(`School approved. Admin can now log in with the email and password you set.`); load(); onAction?.() }
    else setMsg(d.error || 'Error')
    setBusy(false)
  }

  async function reject(id) {
    setBusy(true); setMsg('')
    const res = await ownerFetch(`/api/owner/signups/${id}/reject`, { method: 'POST' })
    if (res.ok) { setMsg('Signup rejected.'); load(); onAction?.() }
    else { const d = await res.json(); setMsg(d.error || 'Error') }
    setBusy(false)
  }

  return (
    <div className="db-page">
      <div className="db-page-h">
        <h1 className="db-page-title">Schools</h1>
        <p className="db-page-desc">Approve new school applications and view active accounts.</p>
      </div>
      {msg && <div className="db-notice">{msg}</div>}
      {loading ? <div className="db-loading">Loading…</div> : (
        <>
          <div className="db-section">
            <div className="db-section-h">Pending applications ({signups.length})</div>
            {signups.length === 0 ? (
              <div className="db-empty">No pending applications.</div>
            ) : (
              <div className="qi-list">
                {signups.map(s => (
                  <SignupCard key={s.id} s={s} onApprove={approve} onReject={reject} busy={busy} />
                ))}
              </div>
            )}
          </div>

          <div className="db-section" style={{ marginTop: '40px' }}>
            <div className="db-section-h">Active schools ({schools.length})</div>
            <div className="db-table">
              <div className="dbt-head dbt-row">
                <span>School</span><span>Location</span><span>Users</span><span>Since</span>
              </div>
              {schools.map(s => <SchoolRow key={s.id} s={s} />)}
              {schools.length === 0 && <div className="db-empty">No active schools yet.</div>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
