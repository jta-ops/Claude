import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function SignupPage() {
  const [form, setForm] = useState({
    school_name: '', country: '', region: '', student_count: '',
    contact_name: '', contact_email: '', contact_phone: '', reason: '',
  })
  const [state, setState] = useState('idle')
  const [error, setError] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function submit(e) {
    e.preventDefault()
    setState('loading'); setError('')
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, student_count: form.student_count ? Number(form.student_count) : undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Submission failed'); setState('idle'); return }
      setState('success')
    } catch { setError('Could not reach the server.'); setState('idle') }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link className="auth-brand" to="/">SchoolBlock</Link>
          <p className="auth-tagline">Request access for your school</p>
        </div>

        {state === 'success' ? (
          <div className="auth-success">
            <div className="ss-mark">✓</div>
            <h2 className="ss-h">Request submitted</h2>
            <p className="ss-body">
              Your request has been received and will be reviewed by our team.
              You'll receive an email at <strong>{form.contact_email}</strong> when it's processed — usually within 1 business day.
            </p>
            <Link className="sf-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }} to="/">← Back to the list</Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit} noValidate>
            <div className="af-section-label">School details</div>

            <div className="sf-field">
              <label className="sf-label" htmlFor="s-name">School name *</label>
              <input id="s-name" className="sf-input sf-input--full" value={form.school_name} onChange={e => set('school_name', e.target.value)} required placeholder="Riverside High School" />
            </div>

            <div className="af-row">
              <div className="sf-field">
                <label className="sf-label" htmlFor="s-country">Country</label>
                <input id="s-country" className="sf-input sf-input--full" value={form.country} onChange={e => set('country', e.target.value)} placeholder="Australia" />
              </div>
              <div className="sf-field">
                <label className="sf-label" htmlFor="s-region">State / Region</label>
                <input id="s-region" className="sf-input sf-input--full" value={form.region} onChange={e => set('region', e.target.value)} placeholder="NSW" />
              </div>
            </div>

            <div className="sf-field">
              <label className="sf-label" htmlFor="s-students">Approximate student count</label>
              <input id="s-students" className="sf-input sf-input--full" type="number" min="1" value={form.student_count} onChange={e => set('student_count', e.target.value)} placeholder="800" />
            </div>

            <div className="af-section-label" style={{ marginTop: '24px' }}>Your contact details</div>

            <div className="sf-field">
              <label className="sf-label" htmlFor="s-cname">Your name *</label>
              <input id="s-cname" className="sf-input sf-input--full" value={form.contact_name} onChange={e => set('contact_name', e.target.value)} required placeholder="James Taylor" />
            </div>

            <div className="sf-field">
              <label className="sf-label" htmlFor="s-email">Work email address *</label>
              <input id="s-email" className="sf-input sf-input--full" type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} required placeholder="j.taylor@school.edu" />
            </div>

            <div className="sf-field">
              <label className="sf-label" htmlFor="s-phone">Phone <span className="sf-optional">(optional)</span></label>
              <input id="s-phone" className="sf-input sf-input--full" type="tel" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} placeholder="+61 2 9999 0000" />
            </div>

            <div className="sf-field">
              <label className="sf-label" htmlFor="s-reason">
                Why do you want access? <span className="sf-optional">(optional — helps us prioritise)</span>
              </label>
              <textarea id="s-reason" className="sf-input sf-input--full sf-textarea" value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="We're currently using X filter and want to supplement it with a better blocklist…" rows={3} />
            </div>

            {error && <div className="sf-error">{error}</div>}

            <button className={`sf-submit ${state === 'loading' ? 'is-loading' : ''}`} type="submit" disabled={state === 'loading'}>
              {state === 'loading' ? <><span className="sf-spinner" />Submitting…</> : 'Request access →'}
            </button>

            <p className="sf-note">
              Already have an account? <Link to="/login">Sign in →</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
