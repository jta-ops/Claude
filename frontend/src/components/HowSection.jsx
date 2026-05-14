const STEPS = [
  {
    n: '01', t: 'Detection',
    b: 'Honeypot DNS, partner-school traffic logs, and a manual triage queue. Nothing is auto-added without a review.',
  },
  {
    n: '02', t: 'Categorisation',
    b: 'Every domain gets a category (GAMES / PORTAL / PROXY / DISGUISE) and a source tag. No invisible tagging.',
  },
  {
    n: '03', t: 'Continuous updates',
    b: 'New entries are published throughout the day as they pass review. The full list and every format regenerate on each batch.',
  },
  {
    n: '04', t: 'Audit trail',
    b: "Every entry has a stable ID. You can ask 'why is this on the list?' and get the source, date, and decision back.",
  },
]

export default function HowSection() {
  return (
    <section className="how" id="how">
      <div className="section-head">
        <div className="sh-left">
          <span className="sh-num">05</span>
          <h2 className="sh-h">How it works.</h2>
        </div>
      </div>
      <div className="how-grid">
        {STEPS.map((s) => (
          <div className="how-step" key={s.n}>
            <div className="hs-num">{s.n}</div>
            <div className="hs-t">{s.t}</div>
            <p className="hs-b">{s.b}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
