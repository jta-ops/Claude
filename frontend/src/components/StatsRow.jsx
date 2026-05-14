export default function StatsRow({ count }) {
  return (
    <div className="stats" id="stats">
      <div className="stat"><div className="stat-k">Domains on list</div><div className="stat-v">{count.toLocaleString()}</div><div className="stat-foot">— since 4 Mar 2024</div></div>
      <div className="stat stat--accent"><div className="stat-k">Added this week</div><div className="stat-v"><span className="plus">+</span>47</div><div className="stat-foot">UBG-mirrors, Poly Track, classroom-xx…</div></div>
      <div className="stat"><div className="stat-k">Removed this week</div><div className="stat-v"><span className="minus">−</span>7</div><div className="stat-foot">Dead hosts · false positives</div></div>
      <div className="stat"><div className="stat-k">Last entry added</div><div className="stat-v">2<span className="stat-unit">h ago</span></div><div className="stat-foot">Continuously updated</div></div>
    </div>
  )
}
