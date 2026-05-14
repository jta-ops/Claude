import { useState, useEffect } from 'react'
import { schoolFetch } from '../../lib/auth'

const FORMATS = [
  { key: 'json',  label: 'JSON',       ext: '.json',  desc: 'Machine-readable structured data.' },
  { key: 'txt',   label: 'Plain text', ext: '.txt',   desc: 'One domain per line.' },
  { key: 'csv',   label: 'CSV',        ext: '.csv',   desc: 'Domain, category, date columns.' },
  { key: 'hosts', label: 'Hosts file', ext: '.hosts', desc: 'Drop-in for /etc/hosts or Pi-hole.' },
]

export default function SchoolDownloads() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    schoolFetch('/api/school/downloads')
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return <div className="db-page"><div className="db-loading">Loading…</div></div>

  return (
    <div className="db-page">
      <div className="db-page-h">
        <h1 className="db-page-title">Downloads</h1>
        <p className="db-page-desc">Download the current SchoolBlock list in your preferred format for direct use in your network filter.</p>
      </div>

      {data?.total != null && (
        <div className="db-notice">
          Current list: {data.total.toLocaleString()} active domains
        </div>
      )}

      <div className="dl-grid">
        {FORMATS.map(f => (
          <div key={f.key} className="dl-card">
            <div className="dlc-label">{f.label}</div>
            <div className="dlc-desc">{f.desc}</div>
            <a className="dlc-btn" href={`/api/list/current.${f.key === 'json' ? 'json' : f.ext.replace('.', '')}`} download>
              Download {f.ext}
            </a>
          </div>
        ))}
      </div>

      <div className="db-section" style={{ marginTop: '40px' }}>
        <div className="db-section-h">Integration guide</div>
        <div className="db-prose">
          <p><strong>Pi-hole:</strong> Go to Group Management → Adlists and add <code>https://schoolblock.codexyy.dev/api/list/current.txt</code></p>
          <p><strong>pfSense / OPNsense:</strong> Use the hosts file format and reference via a scheduled cron download.</p>
          <p><strong>Squid proxy:</strong> Use the plain-text format in an <code>acl</code> dstdomain block.</p>
          <p><strong>Windows DNS:</strong> Import the hosts-file format via PowerShell or the DNS Manager GUI.</p>
        </div>
      </div>

    </div>
  )
}
