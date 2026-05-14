const WEEK_CARDS = [
  {
    tag: 'Pattern of the week',
    title: 'UBG-mirror clones on github.io',
    body: 'Twelve new accounts published the same "Unblocked Browser Games" template this week, each on a slightly different github.io subdomain. Same template, same JS bundle, same iframe targets. We\'re adding them as a family.',
    foot: '+ 12 entries · GAMES · PORTAL',
  },
  {
    tag: 'Disguise of the week',
    title: 'math-class.live',
    body: "A full Khan-Academy-style front page, reached from a 'math homework' search. Click any subject card and you're three lines of JS away from agar.io.",
    foot: '+ 1 entry · DISGUISE',
  },
  {
    tag: 'Surge of the week',
    title: 'Poly Track',
    body: 'Driving game, viral on TikTok. Three hosts went up in two days. We blocked all three and the top-level CDN they share. Expect more.',
    foot: '+ 4 entries · GAMES',
  },
]

export default function WeekSection() {
  return (
    <section className="week" id="week">
      <div className="section-head">
        <div className="sh-left">
          <span className="sh-num">02</span>
          <h2 className="sh-h">This week, <span className="sh-em">in brief.</span></h2>
        </div>
      </div>
      <div className="week-grid">
        {WEEK_CARDS.map((c) => (
          <article className="week-card" key={c.tag}>
            <div className="wc-tag">{c.tag}</div>
            <div className="wc-title">{c.title}</div>
            <p className="wc-body">{c.body}</p>
            <div className="wc-foot">{c.foot}</div>
          </article>
        ))}
      </div>
    </section>
  )
}
