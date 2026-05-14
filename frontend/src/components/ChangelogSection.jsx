import { CHANGELOG } from '../data'

export default function ChangelogSection() {
  return (
    <section className="changelog" id="changelog">
      <div className="section-head">
        <div className="sh-left">
          <span className="sh-num">03</span>
          <h2 className="sh-h">Changelog.</h2>
        </div>
        <div className="sh-right">
          <span className="sh-meta">Recent changes · full diff available via API</span>
        </div>
      </div>
      <ol className="cl-list">
        {CHANGELOG.map((c) => (
          <li className="cl-row" key={c.date}>
            <div className="cl-date">{c.date}</div>
            <div className="cl-stats">
              <span className="cl-add">+{c.added}</span>
              <span className="cl-rem">−{c.removed}</span>
            </div>
            <div className="cl-note">{c.note}</div>
            <div className="cl-link">view diff →</div>
          </li>
        ))}
      </ol>
    </section>
  )
}
