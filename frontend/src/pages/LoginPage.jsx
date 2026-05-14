import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setSchoolToken } from '../lib/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState('idle')
  const [error, setError] = useState('')
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault(); setState('loading'); setError('')
    try {
      const res = await fetch('/api/school/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); setState('idle'); return }
      setSchoolToken(data.token); nav('/dashboard')
    } catch { setError('Could not reach the server.'); setState('idle') }
  }

  return (
    <div className="auth-page"><div className="auth-card">
      <div className="auth-header"><Link className="auth-brand" to="/">SchoolBlock</Link><p className="auth-tagline">School dashboard login</p></div>
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="sf-field"><label className="sf-label">Email address</label><input className="sf-input sf-input--full" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@school.edu" /></div>
        <div className="sf-field"><label className="sf-label">Password</label><input className="sf-input sf-input--full" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" /></div>
        {error && <div className="sf-error">{error}</div>}
        <button className={`sf-submit ${state === 'loading' ? 'is-loading' : ''}`} type="submit" disabled={state === 'loading'}>{state === 'loading' ? 'Signing in…' : 'Sign in →'}</button>
        <p className="sf-note">Don't have access yet? <Link to="/signup">Request access →</Link></p>
      </form>
    </div></div>
  )
}
