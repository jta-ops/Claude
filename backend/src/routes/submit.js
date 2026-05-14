const { Router } = require('express')
const fetch = require('node-fetch')
const db = require('../db')

const router = Router()

function extractDomain(raw) {
  try {
    const url = raw.startsWith('http') ? raw : `https://${raw}`
    return new URL(url).hostname.replace(/^www\./, '')
  } catch { return null }
}

function matchKeywords(text) {
  const keywords = db.prepare(`SELECT word FROM keywords WHERE active = 1`).all().map((r) => r.word)
  return keywords.filter((kw) => text.toLowerCase().includes(kw))
}

router.post('/', async (req, res) => {
  const { url, category, email } = req.body
  if (!url || typeof url !== 'string') return res.status(400).json({ error: 'url is required' })
  const domain = extractDomain(url.trim())
  if (!domain) return res.status(400).json({ error: 'Invalid URL' })
  const existing = db.prepare(`SELECT id FROM domains WHERE domain = ?`).get(domain)
  if (existing) return res.status(409).json({ error: 'Domain already on list', domain })
  const dupe = db.prepare(`SELECT id, status FROM submissions WHERE domain = ?`).get(domain)
  if (dupe) return res.status(409).json({ error: `Already submitted (${dupe.status})`, domain })
  const { lastInsertRowid: subId } = db.prepare(`INSERT INTO submissions (url, domain, submitter_email, status) VALUES (?, ?, ?, 'pending')`).run(url.trim(), domain, email || null)
  res.json({ ok: true, domain, message: 'Submitted for review. Thank you.' })
  setImmediate(async () => {
    try {
      let fetchCode = null, bodyText = ''
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        const resp = await fetch(`https://${domain}`, { signal: controller.signal, headers: { 'User-Agent': 'SchoolBlock-Bot/1.0 (+https://schoolblock.daily/bot)' } })
        clearTimeout(timeout)
        fetchCode = resp.status
        bodyText = await resp.text()
      } catch { fetchCode = 0 }
      const keywords = matchKeywords(bodyText + ' ' + domain)
      const threshold = Number(db.prepare(`SELECT value FROM settings WHERE key = 'ai_threshold'`).get()?.value ?? 70)
      const domainScore = (domain.includes('game') || domain.includes('unblock') || domain.includes('proxy')) ? 80 : 20
      const keywordScore = Math.min(100, keywords.length * 15)
      const aiScore = Math.round((domainScore + keywordScore) / 2)
      const newStatus = keywords.length > 0 || aiScore >= threshold ? 'fasttrack' : 'pending'
      db.prepare(`UPDATE submissions SET fetch_status_code = ?, keyword_matches = ?, ai_score = ?, ai_reasoning = ?, status = ? WHERE id = ?`).run(fetchCode, JSON.stringify(keywords), aiScore, 'heuristic-only', newStatus, subId)
    } catch (err) { console.error('Submission pipeline error:', err.message) }
  })
})

module.exports = router
