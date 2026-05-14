import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="f-top">
        <div className="f-brand">
          <div className="fb-name">SchoolBlock</div>
          <div className="fb-tag">Network filter intelligence for school IT teams.</div>
          <Link className="f-audit-link" to="/audit">Run a network audit →</Link>
        </div>
        <div className="f-cols">
          <div className="f-col"><div className="f-k">Provenance</div><div className="f-v">Maintained by a specialist team since March 2024.</div></div>
          <div className="f-col"><div className="f-k">Update cadence</div><div className="f-v">Continuously updated. Full diff available via API.</div></div>
          <div className="f-col"><div className="f-k">Contact</div><div className="f-v">hello@schoolblock.codexyy.dev</div></div>
        </div>
      </div>
      <div className="f-bottom">
        <span>SCHOOLBLOCK · ISSN 2026—04</span><span className="fb-dot">●</span><span>EST. MARCH 2024</span>
      </div>
    </footer>
  )
}
