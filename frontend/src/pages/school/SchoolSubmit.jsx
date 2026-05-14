import { useState } from 'react'
import { schoolFetch } from '../../lib/auth'

const CATEGORIES = ['Gaming', 'Proxy / VPN', 'Social media', 'Streaming', 'Cheating / AI tools', 'Bypass / Mirror', 'Other']

export default function SchoolSubmit() {
  const [form, setForm] = useState({ domain: '', category: '', notes: '' })
  const [state, setState] = useState('idle')
  const [error, setError] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function submit(e) {
    e.preventDefault()
    setState('loading'); setError('')
    try {
      const res = await schoolFetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify({ url: form.domain, category: form.category, notes: form.notes }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Submission failed'); setState('idle'); return }
      setState('success')
    } catch { setError('Could not reach the server.'); setState('idle') }
  }

  if (state === 'success') {
    return (
      <div className="db-page">
        <div className="db-page-h">
          <h1 className="db-page-title">Submit a domain</h1>
        </div>
        <div className="db-success-state">
          <div className="db-empty-icon">✓</div>
          <div className="db-empty-msg">Domain submitted for review. Thank you.</div>
          <button className="db-btn db-btn--accent" style={{ marginTop: '16px' }} onClick={() => { setForm({ domain: '', category: '', notes: '' }); setState('idle') }}>
            Submit another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="db-page">
      <div className="db-page-h">
        <h1 className="db-page-title">Submit a domain</h1>
        <p className="db-page-desc">Found a domain that should be blocked? Submit it here and our team will review it promptly.</p>
      </div>

      <div className="db-form-card">
        <form onSubmit={submit}>
          <div className="sf-field">
            <label className="sf-label">Domain *</label>
            <div className="sf-prefix-wrap">
              <span className="sf-prefix">https://</span>
              <input
                className="sf-input sf-input--prefixed"
                placeholder="example.com"
                value={form.domain}
                onChange={e => set('domain', e.target.value.replace(/^https?:\/\//, ''))}
                required
              />
            </div>
          </div>
          <div className="sf-field">
            <label className="sf-label">Category</label>
            <select className="sf-input" value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select a category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="sf-field">
            <label className="sf-label">Notes <span className="sf-optional">(optional)</span></label>
            <textarea
              className="sf-input sf-textarea"
              placeholder="Why should this domain be blocked? Any context helps."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
            />
          </div>
          {error && <div className="sf-error">{error}</div>}
          <button className={`sf-submit ${state === 'loading' ? 'is-loading' : ''}`} type="submit" disabled={state === 'loading'}>
            {state === 'loading' ? <><span className="sf-spinner" />Submitting…</> : 'Submit for review →'}
          </button>
        </form>
      </div>
    </div>
  )
}
