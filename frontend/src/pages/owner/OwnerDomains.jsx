import { useState, useEffect, useCallback } from 'react'
import { ownerFetch } from '../../lib/auth'

export default function OwnerDomains() {
  const [domains, setDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [newDomain, setNewDomain] = useState({ domain: '', category: '', notes: '' })
  const [bulk, setBulk] = useState('')
  const [bulkMode, setBulkMode] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await ownerFetch('/api/owner/domains?limit=500')
    if (res.ok) { const d = await res.json(); setDomains(d.rows || []) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = domains.filter(d =>
    d.domain.toLowerCase().includes(search.toLowerCase()) ||
    (d.category || '').toLowerCase().includes(search.toLowerCase())
  )

  async function addDomain(e) {
    e.preventDefault()
    setBusy(true); setMsg('')
    const res = await ownerFetch('/api/owner/domains', {
      method: 'POST',
      body: JSON.stringify(newDomain),
    })
    if (res.ok) {
      setMsg('Domain added.'); setNewDomain({ domain: '', category: '', notes: '' }); setAdding(false); load()
    } else { const d = await res.json(); setMsg(d.error || 'Error') }
    setBusy(false)
  }

  async function bulkAdd(e) {
    e.preventDefault()
    setBusy(true); setMsg('')
    const lines = bulk.split('\n').map(l => l.trim()).filter(Boolean)
    const res = await ownerFetch('/api/owner/domains/bulk', {
      method: 'POST',
      body: JSON.stringify({ domains: lines }),
    })
    const d = await res.json()
    if (res.ok) { setMsg(`Added ${d.added} domains.`); setBulk(''); setBulkMode(false); load() }
    else setMsg(d.error || 'Error')
    setBusy(false)
  }

  async function remove(id, domain) {
    if (!confirm(`Remove ${domain} from the list?`)) return
    setBusy(true); setMsg('')
    const res = await ownerFetch(`/api/owner/domains/${id}`, { method: 'DELETE' })
    if (res.ok) { setMsg('Domain removed.'); load() }
    else { const d = await res.json(); setMsg(d.error || 'Error') }
    setBusy(false)
  }

  async function publish() {
    if (!confirm('Publish current list? This regenerates all public download files.')) return
    setBusy(true); setMsg('')
    const res = await ownerFetch('/api/owner/publish', { method: 'POST' })
    if (res.ok) setMsg('List published successfully.')
    else { const d = await res.json(); setMsg(d.error || 'Error') }
    setBusy(false)
  }

  return (
    <div className="db-page">
      <div className="db-page-h">
        <h1 className="db-page-title">Domain list</h1>
        <p className="db-page-desc">Manage all blocked domains. Changes take effect immediately on approve; publish to update download files.</p>
      </div>

      {msg && <div className="db-notice">{msg}</div>}

      <div className="db-toolbar">
        <input className="sf-input db-search" placeholder="Search domains or categories…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="db-toolbar-actions">
          <button className="db-btn" onClick={() => { setAdding(a => !a); setBulkMode(false) }}>+ Add domain</button>
          <button className="db-btn" onClick={() => { setBulkMode(b => !b); setAdding(false) }}>+ Bulk import</button>
          <button className="db-btn db-btn--accent" disabled={busy} onClick={publish}>Publish list</button>
        </div>
      </div>

      {adding && (
        <form className="db-inline-form" onSubmit={addDomain}>
          <input className="sf-input" placeholder="domain.com" value={newDomain.domain} onChange={e => setNewDomain(n => ({ ...n, domain: e.target.value }))} required />
          <input className="sf-input" placeholder="Category (e.g. gaming)" value={newDomain.category} onChange={e => setNewDomain(n => ({ ...n, category: e.target.value }))} />
          <input className="sf-input" placeholder="Notes (optional)" value={newDomain.notes} onChange={e => setNewDomain(n => ({ ...n, notes: e.target.value }))} />
          <button className="db-btn db-btn--accent" type="submit" disabled={busy}>Add</button>
          <button className="db-btn" type="button" onClick={() => setAdding(false)}>Cancel</button>
        </form>
      )}

      {bulkMode && (
        <form className="db-inline-form db-inline-form--col" onSubmit={bulkAdd}>
          <textarea
            className="sf-input sf-textarea"
            placeholder={"One domain per line:\nexample.com\ngaming-site.net\n..."}
            value={bulk}
            onChange={e => setBulk(e.target.value)}
            rows={8}
            required
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="db-btn db-btn--accent" type="submit" disabled={busy}>Import all</button>
            <button className="db-btn" type="button" onClick={() => setBulkMode(false)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="db-loading">Loading…</div> : (
        <div className="db-table">
          <div className="dbt-head dbt-row">
            <span>Domain</span><span>Category</span><span>Added</span><span>Source</span><span></span>
          </div>
          {filtered.map(d => (
            <div key={d.domain} className="dbt-row">
              <span className="dbt-domain">{d.domain}</span>
              <span>{d.category || '—'}</span>
              <span className="dbt-mute">{new Date(d.created_at).toLocaleDateString()}</span>
              <span><span className={`db-pill db-pill--${d.source || 'manual'}`}>{d.source || 'manual'}</span></span>
              <span>
                <button className="db-btn-sm db-btn-sm--danger" disabled={busy} onClick={() => remove(d.id, d.domain)}>Remove</button>
              </span>
            </div>
          ))}
          {filtered.length === 0 && <div className="db-empty">No domains match your search.</div>}
        </div>
      )}
      <div className="db-count">{filtered.length.toLocaleString()} of {domains.length.toLocaleString()} domains shown</div>
    </div>
  )
}
