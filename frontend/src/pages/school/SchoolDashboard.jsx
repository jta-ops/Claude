import { useState, useEffect, useCallback } from 'react'
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { schoolFetch, clearSchoolToken } from '../../lib/auth'
import SchoolOverview from './SchoolOverview'
import SchoolUsers from './SchoolUsers'
import SchoolAudit from './SchoolAudit'
import SchoolHistory from './SchoolHistory'
import SchoolDownloads from './SchoolDownloads'
import SchoolSubmit from './SchoolSubmit'

export default function SchoolDashboard() {
  const [me, setMe] = useState(null)
  const { pathname } = useLocation()
  const nav = useNavigate()

  const loadMe = useCallback(async () => {
    const res = await schoolFetch('/api/school/me')
    if (res.ok) {
      const d = await res.json()
      setMe({ ...d.user, school_name: d.school?.name })
    }
  }, [])

  useEffect(() => { loadMe() }, [loadMe])

  function logout() { clearSchoolToken(); nav('/login') }

  const navItems = [
    { to: '/dashboard',           label: 'Overview',    exact: true },
    { to: '/dashboard/users',     label: 'Users' },
    { to: '/dashboard/audit',     label: 'Audit tool' },
    { to: '/dashboard/history',   label: 'Audit history' },
    { to: '/dashboard/downloads', label: 'Downloads' },
    { to: '/dashboard/submit',    label: 'Submit domain' },
  ]

  return (
    <div className="db-layout">
      <aside className="db-sidebar">
        <div className="db-sidebar-brand">
          <div className="dsb-logo">SB</div>
          <div>
            <div className="dsb-name">{me?.school_name || 'SchoolBlock'}</div>
            <div className="dsb-role">School dashboard</div>
          </div>
        </div>
        <nav className="db-nav">
          {navItems.map(item => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to)
            return (
              <Link key={item.to} to={item.to} className={`db-nav-item ${active ? 'is-active' : ''}`}>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="db-sidebar-foot">
          {me && (
            <div className="db-sidebar-user">
              <div className="dsu-name">{me.name || me.email}</div>
              <div className="dsu-role">{me.role}</div>
            </div>
          )}
          <Link to="/" className="db-nav-item">← Public site</Link>
          <button className="db-nav-item db-nav-logout" onClick={logout}>Sign out</button>
        </div>
      </aside>

      <main className="db-main">
        <Routes>
          <Route index                  element={<SchoolOverview />} />
          <Route path="users"           element={<SchoolUsers me={me} />} />
          <Route path="audit"           element={<SchoolAudit />} />
          <Route path="history"         element={<SchoolHistory />} />
          <Route path="downloads"       element={<SchoolDownloads />} />
          <Route path="submit"          element={<SchoolSubmit />} />
        </Routes>
      </main>
    </div>
  )
}
