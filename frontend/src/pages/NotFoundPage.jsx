import { Link } from 'react-router-dom'
import Masthead from '../components/Masthead'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

export default function NotFoundPage() {
  return (
    <><Masthead /><Nav />
    <main className="shell">
      <div className="scorecard-wait">
        <div className="sw-h" style={{ fontSize: 'clamp(48px, 6vw, 80px)', fontFamily: 'var(--fontDisplay)' }}>404.</div>
        <p className="sw-body">This page doesn't exist.</p>
        <Link className="rp-btn" to="/">← Back to the list</Link>
      </div>
    </main>
    <Footer /></>
  )
}
