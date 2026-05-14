import { useState, useEffect, useCallback } from 'react'
import { ownerFetch } from '../../lib/auth'

function KeywordsPanel() {
  const [keywords, setKeywords] = useState([])
  const [loading, setLoading] = useState(true)
  const [newKw, setNewKw] = useState({ word: '', weight: '1', category: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await ownerFetch('/api/owner/keywords')
    if (res.ok) setKeywords(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function add(e) {
    e.preventDefault()
    setBusy(true); setMsg('')
    const res = await ownerFetch('/api/owner/keywords', {
      method: 'POST',
      body: JSON.stringify({ ...newKw, weight: Number(newKw.weight) }),
    })
    if (res.ok) { setMsg('Keyword added.'); setNewKw({ word: '', weight: '1', category: '' }); load() }
    else { const d = await res.json(); setMsg(d.error || 'Error') }
    setBusy(false)
  }

  async function remove(id) {
    setBusy(true)
    await ownerFetch(`/api/owner/keywords/${id}`, { method: 'DELETE' })
    load(); setBusy(false)
  }

  return (
    <div className="db-section">
      <div className="db-section-h">Detection keywords</div>
      <p className="db-section-desc">Keywords and their weights used to score auto-detected domains. Higher weight = more influence on score.</p>
      {msg && <div className="db-notice db-notice--sm">{msg}</div>}
      <form className="db-inline-form" onSubmit={add}>
        <input className="sf-input" placeholder="Keyword" value={newKw.word} onChange={e => setNewKw(n => ({ ...n, word: e.target.value }))} required />
        <input className="sf-input" style={{ width: '80px' }} placeholder="Weight" type="number" min="1" max="10" value={newKw.weight} onChange={e => setNewKw(n => ({ ...n, weight: e.target.value }))} />
        <input className="sf-input" placeholder="Category tag" value={newKw.category} onChange={e => setNewKw(n => ({ ...n, category: e.target.value }))} />
        <button className="db-btn db-btn--accent" type="submit" disabled={busy}>Add</button>
      </form>
      {loading ? <div className="db-loading">Loading…</div> : (
        <div className="db-table" style={{ marginTop: '16px' }}>
          <div className="dbt-head dbt-row">
            <span>Keyword</span><span>Weight</span><span>Category</span><span></span>
          </div>
          {keywords.map(k => (
            <div key={k.id} className="dbt-row">
              <span>{k.word}</span>
              <span>{k.weight}</span>
              <span>{k.category || '—'}</span>
              <span><button className="db-btn-sm db-btn-sm--danger" disabled={busy} onClick={() => remove(k.id)}>Remove</button></span>
            </div>
          ))}
          {keywords.length === 0 && <div className="db-empty">No keywords yet.</div>}
        </div>
      )}
    </div>
  )
}

function SiteSettings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    ownerFetch('/api/owner/settings').then(r => r.ok ? r.json() : {}).then(d => { setSettings(d); setLoading(false) })
  }, [])

  async function save(e) {
    e.preventDefault()
    setBusy(true); setMsg('')
    const res = await ownerFetch('/api/owner/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    })
    if (res.ok) setMsg('Settings saved.')
    else { const d = await res.json(); setMsg(d.error || 'Error') }
    setBusy(false)
  }

  function set(k, v) { setSettings(s => ({ ...s, [k]: v }) ) }

  if (loading) return <div className="db-loading">Loading…</div>

  return (
    <div className="db-section">
      <div className="db-section-h">Site settings</div>
      {msg && <div className="db-notice db-notice--sm">{msg}</div>}
      <form className="db-settings-form" onSubmit={save}>
        <div className="sf-field">
          <label className="sf-label">Fast-track score threshold</label>
          <input className="sf-input" type="number" min="1" max="100" value={settings.fasttrack_threshold ?? 15} onChange={e => set('fasttrack_threshold', Number(e.target.value))} />
          <span className="sf-hint">Domains scoring at or above this go to the fast-track queue.</span>
        </div>
        <div className="sf-field">
          <label className="sf-label">Minimum score for submission queue</label>
          <input className="sf-input" type="number" min="0" max="100" value={settings.min_queue_score ?? 5} onChange={e => set('min_queue_score', Number(e.target.value))} />
          <span className="sf-hint">Submissions below this score are silently discarded.</span>
        </div>
        <div className="sf-field">
          <label className="sf-label">Detection interval (hours)</label>
          <input className="sf-input" type="number" min="1" max="24" value={settings.detection_interval_hours ?? 2} onChange={e => set('detection_interval_hours', Number(e.target.value))} />
          <span className="sf-hint">How often the auto-detector runs. Restart the server to apply changes.</span>
        </div>
        <div className="sf-field">
          <label className="sf-label">Domains per detection cycle</label>
          <input className="sf-input" type="number" min="1" max="20" value={settings.detection_batch_size ?? 3} onChange={e => set('detection_batch_size', Number(e.target.value))} />
        </div>
        <button className="db-btn db-btn--accent" type="submit" disabled={busy}>Save settings</button>
      </form>
    </div>
  )
}

export default function OwnerSettings() {
  return (
    <div className="db-page">
      <div className="db-page-h">
        <h1 className="db-page-title">Settings</h1>
        <p className="db-page-desc">Control detection sensitivity, keywords, and global site behaviour.</p>
      </div>
      <KeywordsPanel />
      <div style={{ marginTop: '48px' }}>
        <SiteSettings />
      </div>
    </div>
  )
}
