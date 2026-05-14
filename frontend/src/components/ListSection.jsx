import { useState, useMemo } from 'react'
import { ENTRIES, CATEGORIES, LIST_TOTAL } from '../data'

function CategoryBadge({ cat }) {
  return <span className={`cat-badge cat-${cat.toLowerCase()}`}>{cat}</span>
}

export default function ListSection() {
  const [filter, setFilter] = useState('ALL')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    return ENTRIES.filter((e) => {
      if (filter !== 'ALL' && e.cat !== filter) return false
      if (query && !e.d.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [filter, query])

  return (
    <section className="list" id="list">
      <div className="section-head">
        <div className="sh-left">
          <span className="sh-num">01</span>
          <h2 className="sh-h">The list.</h2>
        </div>
        <div className="sh-right">
          <span className="sh-meta">Showing latest {filtered.length} of {LIST_TOTAL.toLocaleString()}</span>
        </div>
      </div>

      <div className="list-controls">
        <div className="filter-row">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`filter ${filter === c.id ? 'is-active' : ''}`}
              onClick={() => setFilter(c.id)}
            >
              <span className="f-label">{c.label}</span>
              <span className="f-count">{c.count.toLocaleString()}</span>
            </button>
          ))}
        </div>
        <div className="search-row">
          <span className="search-icon">⌕</span>
          <input
            className="search-input"
            placeholder="Filter by domain… e.g. ubg, classroom, .github.io"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="search-clear" onClick={() => setQuery('')}>×</button>
          )}
        </div>
      </div>

      <div className="list-table">
        <div className="lt-head">
          <div className="lt-c lt-c--num">#</div>
          <div className="lt-c lt-c--domain">Domain</div>
          <div className="lt-c lt-c--cat">Category</div>
          <div className="lt-c lt-c--src">Source</div>
          <div className="lt-c lt-c--age">Added</div>
        </div>

        {filtered.length === 0 && (
          <div className="lt-empty">No matches — try a different filter.</div>
        )}

        {filtered.map((e, i) => (
          <div className="lt-row" key={e.d}>
            <div className="lt-c lt-c--num">{String(i + 1).padStart(3, '0')}</div>
            <div className="lt-c lt-c--domain"><span className="dom">{e.d}</span></div>
            <div className="lt-c lt-c--cat"><CategoryBadge cat={e.cat} /></div>
            <div className="lt-c lt-c--src">{e.src}</div>
            <div className="lt-c lt-c--age">{e.age} ago</div>
          </div>
        ))}

        <div className="lt-foot">
          <span>{(LIST_TOTAL - filtered.length).toLocaleString()} earlier entries not shown</span>
          <span className="lt-foot-r">Download full list ↓</span>
        </div>
      </div>
    </section>
  )
}
