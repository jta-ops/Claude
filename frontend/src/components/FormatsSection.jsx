const FORMATS = [
  { name: 'CSV',         use: 'Spreadsheets, audit reports',      ext: 'schoolblock.csv' },
  { name: 'hosts',       use: '/etc/hosts, Pi-hole, AdGuard',     ext: 'hosts.txt' },
  { name: 'RPZ',         use: 'BIND DNS RPZ zones',               ext: 'schoolblock.rpz' },
  { name: 'JSON',        use: 'API consumers, scripts',           ext: 'list.json' },
  { name: 'NextDNS',     use: 'Native denylist import',           ext: 'nextdns.txt' },
  { name: 'pfBlockerNG', use: 'pfSense filter format',            ext: 'pfblockerng.txt' },
]

export default function FormatsSection() {
  return (
    <section className="formats" id="formats">
      <div className="section-head">
        <div className="sh-left">
          <span className="sh-num">04</span>
          <h2 className="sh-h">Formats <span className="sh-em">&amp; API.</span></h2>
        </div>
        <div className="sh-right">
          <span className="sh-meta">All formats update continuously</span>
        </div>
      </div>

      <div className="fm-grid">
        {FORMATS.map((f) => (
          <div className="fm-card" key={f.name}>
            <div className="fm-name">{f.name}</div>
            <div className="fm-use">{f.use}</div>
            <div className="fm-file">{f.ext}</div>
            <div className="fm-actions">
              <a className="fm-btn" href={`/api/list/current.${f.ext.split('.').pop()}`} download>Download ↓</a>
              <button className="fm-btn fm-btn--ghost" onClick={() => navigator.clipboard?.writeText(`https://schoolblock.codexyy.dev/api/list/current.${f.ext.split('.').pop()}`)}>Copy URL</button>
            </div>
          </div>
        ))}
      </div>

      <div className="api-block">
        <div className="api-tag">JSON API</div>
        <pre className="api-code">{`GET https://schoolblock.codexyy.dev/v1/list.json
GET https://schoolblock.codexyy.dev/v1/diff/2026-05-13.json
GET https://schoolblock.codexyy.dev/v1/category/games.json

# webhook — POST to your endpoint on every update, HMAC-signed
POST <your-endpoint>`}</pre>
      </div>
    </section>
  )
}
