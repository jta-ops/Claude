import { useState, useEffect, useCallback } from 'react'
import { schoolFetch } from '../../lib/auth'

export default function SchoolUsers({ me }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const isAdmin = me?.role === 'admin'

  const load = useCallback(async () => {
    setLoading(true)
    const res = await schoolFetch('/api/school/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function addUser(e) {
    e.preventDefault()
    setBusy(true); setMsg('')
    const res = await schoolFetch('/api/school/users', {
      method: 'POST',
      body: JSON.stringify(form),
    })
    const d = await res.json()
    if (res.ok) { setMsg(`User ${form.email} added.`); setForm({ name: '', email: '', password: '', role: 'member' }); setAdding(false); load() }
    else setMsg(d.error || 'Error')
    setBusy(false)
  }

  async function removeUser(id, email) {
    if (!confirm(`Remove ${email} from your school?`)) return
    setBusy(true)
    await schoolFetch(`/api/school/users/${id}`, { method: 'DELETE' })
    load(); setBusy(false)
  }

  async function changeRole(id, role) {
    setBusy(true)
    await schoolFetch(`/api/school/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
    load(); setBusy(false)
  }

  return (
    <div className="db-page">
      <div className="db-page-h">
        <h1 className="db-page-title">Team</h1>
        <p className="db-page-desc">Manage who has access to your school's dashboard.</p>
      </div>

      {msg && <div className="db-notice">{msg}</div>}

      {isAdmin && (
        <div className="db-toolbar">
          <button className="db-btn" onClick={() => setAdding(a => !a)}>+ Add member</button>
        </div>
      )}

      {adding && (
        <form className="db-inline-form db-inline-form--col" onSubmit={addUser}>
          <div className="db-inline-form-row">
            <input className="sf-input" placeholder="Full name" value={form.name} onChange={e => set('name', e.target.value)} />
            <input className="sf-input" type="email" placeholder="Email address" value={form.email} onChange={e => set('email', e.target.value)} required />
            <input className="sf-input" type="password" placeholder="Initial password" value={form.password} onChange={e => set('password', e.target.value)} required />
            <select className="sf-input" value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="db-btn db-btn--accent" type="submit" disabled={busy}>Add member</button>
            <button className="db-btn" type="button" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="db-loading">Loading…</div> : (
        <div className="db-table">
          <div className="dbt-head dbt-row">
            <span>Name</span><span>Email</span><span>Role</span><span>Joined</span>{isAdmin && <span></span>}
          </div>
          {users.map(u => (
            <div key={u.id} className="dbt-row">
              <span>{u.name || '—'}</span>
              <span>{u.email}</span>
              <span>
                {isAdmin && u.id !== me?.id ? (
                  <select
                    className="sf-input sf-input--sm"
                    value={u.role}
                    onChange={e => changeRole(u.id, e.target.value)}
                    disabled={busy}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className={`db-pill db-pill--${u.role}`}>{u.role}</span>
                )}
              </span>
              <span className="dbt-mute">{new Date(u.created_at).toLocaleDateString()}</span>
              {isAdmin && (
                <span>
                  {u.id !== me?.id && (
                    <button className="db-btn-sm db-btn-sm--danger" disabled={busy} onClick={() => removeUser(u.id, u.email)}>Remove</button>
                  )}
                </span>
              )}
            </div>
          ))}
          {users.length === 0 && <div className="db-empty">No users found.</div>}
        </div>
      )}
    </div>
  )
}
