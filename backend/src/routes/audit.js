const { Router } = require('express')
const { randomUUID } = require('crypto')
const db = require('../db')

const router = Router()

const LIST_SIZES = { top25: 25, top50: 50, top100: 100, full: 99999 }

router.get('/start', (req, res) => {
  const { size = 'top100', method = 'console' } = req.query
  if (!LIST_SIZES[size]) return res.status(400).json({ error: 'Invalid size. Use top25, top50, top100, or full.' })
  const token = randomUUID()
  const limit = LIST_SIZES[size]
  const domains = db.prepare(`SELECT domain FROM domains WHERE status = 'active' ORDER BY created_at DESC LIMIT ?`).all(limit).map((r) => r.domain)
  db.prepare(`INSERT INTO audit_sessions (token, list_size) VALUES (?, ?)`).run(token, size)
  const domainList = JSON.stringify(domains)
  let script
  if (method === 'console') script = generateConsoleScript(token, domainList)
  else if (method === 'bookmarklet') script = generateBookmarklet(token, domainList)
  else script = generateCurlScript(domains)
  res.json({ token, size, count: domains.length, method, script })
})

router.post('/result', (req, res) => {
  const { token, results } = req.body
  if (!token || !Array.isArray(results)) return res.status(400).json({ error: 'token and results[] required' })
  const session = db.prepare(`SELECT id FROM audit_sessions WHERE token = ?`).get(token)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  const blocked   = results.filter((r) => r.blocked)
  const unblocked = results.filter((r) => !r.blocked)
  const score     = results.length ? Math.round((blocked.length / results.length) * 100) : 0
  const scorecard = {
    token, total: results.length, blocked: blocked.length,
    unblocked: unblocked.length, score,
    grade: score >= 95 ? 'A' : score >= 85 ? 'B' : score >= 70 ? 'C' : score >= 50 ? 'D' : 'F',
    unblockedDomains: unblocked,
  }
  db.prepare(`UPDATE audit_sessions SET completed_at = datetime('now'), results_json = ? WHERE token = ?`).run(JSON.stringify(scorecard), token)
  res.json(scorecard)
})

router.get('/result/:token', (req, res) => {
  const session = db.prepare(`SELECT completed_at, results_json FROM audit_sessions WHERE token = ?`).get(req.params.token)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  if (!session.completed_at) return res.status(202).json({ status: 'pending' })
  res.json(JSON.parse(session.results_json))
})

function generateConsoleScript(token, domainListJson) {
  return `SchoolBlock.audit = async function({ list = 'top100' } = {}) {
  const domains = ${domainListJson};
  console.log('%c SchoolBlock Network Audit ', 'background:#7a2518;color:#fff;font-weight:bold');
  console.log('Testing ' + domains.length + ' domains...');
  const results = [];
  for (const d of domains) {
    try {
      const r = await fetch('https://' + d + '/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
      results.push({ domain: d, blocked: false, status: r.status });
    } catch {
      results.push({ domain: d, blocked: true });
    }
  }
  const blocked = results.filter(r => r.blocked).length;
  console.log(blocked + '/' + domains.length + ' blocked');
  await fetch('/api/audit/result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: '${token}', results })
  });
  console.log('Results submitted. Token: ${token}');
  return results;
};
SchoolBlock.audit();`
}

function generateBookmarklet(token, domainListJson) {
  const fn = generateConsoleScript(token, domainListJson).replace(/\n/g, ' ')
  return `javascript:(function(){${encodeURIComponent(fn)}})();`
}

function generateCurlScript(domains) {
  const lines = domains.slice(0, 50).map(
    (d) => `echo -n "${d}: " && curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://${d}" || echo "ERR"`
  )
  return `#!/bin/bash\n# SchoolBlock Network Audit\n# Run this on your school network\n\n` + lines.join('\n')
}

module.exports = router
