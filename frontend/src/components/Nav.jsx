import { Link, useLocation } from 'react-router-dom'

const HOME_ITEMS = [['#list','The list'],['#week','This week'],['#changelog','Changelog'],['#formats','Formats / API'],['#submit','Submit a site']]

export default function Nav() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  return (
    <nav className="nav">
      <ul>
        {isHome ? HOME_ITEMS.map(([href, label]) => <li key={href}><a href={href}>{label}</a></li>) : <li><Link to="/">← The list</Link></li>}
      </ul>
      <div className="nav-right">
        <Link className={`nav-audit-link ${pathname === '/audit' ? 'is-active' : ''}`} to="/audit">Network audit tool ↗</Link>
        <span className="nav-live"><span className="nl-dot">●</span> Live</span>
      </div>
    </nav>
  )
}
