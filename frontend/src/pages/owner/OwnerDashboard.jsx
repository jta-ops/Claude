import { useState, useEffect, useCallback } from 'react'
import { Link, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { ownerFetch, clearOwnerToken } from '../../lib/auth'
import OwnerQueue from './OwnerQueue'
import OwnerSchools from './OwnerSchools'
import OwnerDomains from './OwnerDomains'
import OwnerDetection from './OwnerDetection'
import OwnerSettings from './OwnerSettings'

function StatCard({ label, value, accent, badge }) {
  return (
    <div className={`db-stat ${accent ? 'db-stat--accent' : ''}`}>
      <div className="dbs-v">{value ?? '—'}</div>
      <div className="dbs-k">{label}</div>
      {badge && <div className="dbs-badge">{badge}</div>}
    </div>
  )
}

function Overview({ stats }) {
  if (!stats) return <div className="db-loading">Loading…</div>
  return (
    <div className="db-overview">
      <div className="db-stats-grid">
        <StatCard label="Domains on list"     value={stats.domains?.toLocaleString()} />
        <StatCard label="Fast-track queue"    value={stats.fasttrack}  accent={stats.fasttrack > 0} badge={stats.fasttrack > 0 ? 'Needs review' : null} />
        <StatCard label="Normal queue"        value={stats.pending} />
        <StatCard label="Active schools"      value={stats.schools} />
        <StatCard label="Pending signups"     value={stats.signupsPending} accent={stats.signupsPending > 0} badge={stats.signupsPending > 0 ? 'Action needed' : null} />
        <StatCard label="Detections today"    value={stats.todayDetections} />
      </div>

      <div className="db-section">
        <div className="db-section-h">Recent auto-detections</div>
        <div className="db-table">
          <div className="dbt-head dbt-row">
            <span>Domain</span><span>Outcome</span><span>Score</span><span>Time</span>
          </div>
          {(stats.recentDetections || []).map(d => (
            <div key={d.domain + d.ran_at} className="dbt-row">
              <span className="dbt-domain">{d.domain}</span>
              <span><span className={`db-pill db-pill--${d.outcome}`}>{d.outcome}</span></span>
              <span>{d.ai_score ?? '—'}</span>
              <span className="dbt-mute">{new Date(d.ran_at).toLocaleTimeString()}</span>
            </div>
          ))}
          {stats.recentDetections?.length === 0 && <div className="db-empty">No detections yet today</div>}
        </div>
      </div>

      <div className="db-quick-links">
        <Link className="dql-btn" to="/owner/queue/fasttrack">Review fast-track queue →</Link>
        <Link className="dql-btn" to="/owner/schools">Review school signups →</Link>
        <Link className="dql-btn dql-btn--ghost" to="/owner/domains">Manage domains →</Link>
      </div>
    </div>
  )
}

export default function OwnerDashboard() {
  const [stats, setStats] = useState(null)
  const { pathname } = useLocation()
  const nav = useNavigate()

  const loadStats = useCallback(async () => {
    try {
      const res = await ownerFetch('/api/owner/stats')
      if (res.ok) setStats(await res.json())
    } catch {}
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  function logout() { clearOwnerToken(); nav('/owner/login') }

  const navItems = [
    { to: '/owner',                  label: 'Overview',     exact: true },
    { to: '/owner/queue/fasttrack',  label: 'Fast-track',   badge: stats?.fasttrack },
    { to: '/owner/queue/pending',    label: 'Normal queue',  badge: stats?.pending },
    { to: '/owner/schools',          label: 'Schools',       badge: stats?.signupsPending },
    { to: '/owner/domains',          label: 'Domains' },
    { to: '/owner/detection',        label: 'Detection log' },
    { to: '/owner/settings',         label: 'Settings' },
  ]

  return (
    <div className="db-layout">
      <aside className="db-sidebar">
        <div className="db-sidebar-brand">
          <div className="dsb-logo">SB</div>
          <div>
            <div className="dsb-name">SchoolBlock</div>
            <div className="dsb-role">Owner dashboard</div>
          </div>
        </div>
        <nav className="db-nav">
          {navItems.map(item => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to)
            return (
              <Link key={item.to} to={item.to} className={`db-nav-item ${active ? 'is-active' : ''}`}>
                {item.label}
                {item.badge > 0 && <span className="db-nav-badge">{item.badge}</span>}
              </Link>
            )
          })}
        </nav>
        <div className="db-sidebar-foot">
          <Link to="/" className="db-nav-item">← Public site</Link>
          <button className="db-nav-item db-nav-logout" onClick={logout}>Sign out</button>
        </div>
      </aside>

      <main className="db-main">
        <Routes>
          <Route index                    element={<Overview stats={stats} />} />
          <Route path="queue/:type"       element={<OwnerQueue onApprove={loadStats} />} />
          <Route path="schools"           element={<OwnerSchools onAction={loadStats} />} />
          <Route path="domains"           element={<OwnerDomains />} />
          <Route path="detection"         element={<OwnerDetection />} />
          <Route path="settings"          element={<OwnerSettings />} />
        </Routes>
      </main>
    </div>
  )
}
