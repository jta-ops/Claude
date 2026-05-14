import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setOwnerToken } from '../../lib/auth'

export default function OwnerLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState('idle')
  const [error, setError] = useState('')
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault(); setState('loading'); setError('')
    try {
      const res = await fetch('/api/owner/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); setState('idle'); return }
      setOwnerToken(data.token); nav('/owner')
    } catch { setError('Could not reach the server.'); setState('idle') }
  }

  return (
    <div className="auth-page"><div className="auth-card">
      <div className="auth-header"><Link className="auth-brand" to="/">SchoolBlock</Link><p className="auth-tagline">Owner dashboard</p></div>
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="sf-field"><label className="sf-label">Username</label><input className="sf-input sf-input--full" value={username} onChange={e => setUsername(e.target.value)} required placeholder="owner" /></div>
        <div className="sf-field"><label className="sf-label">Password</label><input className="sf-input sf-input--full" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" /></div>
        {error && <div className="sf-error">{error}</div>}
        <button className={`sf-submit ${state === 'loading' ? 'is-loading' : ''}`} type="submit" disabled={state === 'loading'}>{state === 'loading' ? 'Signing in…' : 'Sign in →'}</button>
      </form>
    </div></div>
  )
}
