export default function Hero({ count }) {
  return (
    <section className="hero">
      <div className="hero-eyebrow">
        <span className="eb-num">№ 142</span>
        <span className="eb-rule" />
        <span className="eb-meta">A continuously updated intelligence feed · maintained since 2024</span>
      </div>
      <h1 className="hero-h">A daily blocklist for <span className="hero-em">school networks.</span></h1>
      <p className="hero-lede">
        <span className="lede-num">{count.toLocaleString()}</span> domains where students try to get around the school filter — gaming sites, proxies, and disguised portals. Updated continuously by a specialist team.
      </p>
      <div className="hero-meta">
        <span className="hm-dot">●</span><span>Continuously updated.</span><span className="hm-sep">/</span><span>+47 this week.</span><span className="hm-sep">/</span><span>Last entry 2h ago.</span>
      </div>
    </section>
  )
}
