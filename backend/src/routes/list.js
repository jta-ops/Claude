const { Router } = require('express')
const db = require('../db')

const router = Router()

router.get('/current', (req, res) => {
  const { category, limit = 5000, offset = 0 } = req.query
  let query = `SELECT domain, category, added_month, source, created_at FROM domains WHERE status = 'active'`
  const params = []
  if (category) { query += ` AND category = ?`; params.push(category.toUpperCase()) }
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
  params.push(Number(limit), Number(offset))
  const rows = db.prepare(query).all(...params)
  const total = db.prepare(`SELECT COUNT(*) as n FROM domains WHERE status = 'active'`).get().n
  res.json({ total, count: rows.length, domains: rows })
})

router.get('/current.txt', (req, res) => {
  const rows = db.prepare(`SELECT domain FROM domains WHERE status = 'active' ORDER BY domain`).all()
  res.type('text/plain').send(rows.map((r) => r.domain).join('\n'))
})

router.get('/current.csv', (req, res) => {
  const rows = db.prepare(`SELECT domain, category, added_month, source FROM domains WHERE status = 'active' ORDER BY domain`).all()
  const header = 'domain,category,added_month,source'
  const lines  = rows.map((r) => `${r.domain},${r.category},${r.added_month},${r.source}`)
  res.type('text/csv').setHeader('Content-Disposition', 'attachment; filename="schoolblock.csv"').send([header, ...lines].join('\n'))
})

router.get('/current.hosts', (req, res) => {
  const rows = db.prepare(`SELECT domain FROM domains WHERE status = 'active' ORDER BY domain`).all()
  res.type('text/plain').setHeader('Content-Disposition', 'attachment; filename="hosts.txt"').send(rows.map((r) => `0.0.0.0 ${r.domain}`).join('\n'))
})

router.get('/:year/:month', (req, res) => {
  const month = `${req.params.year}-${req.params.month}`
  const archive = db.prepare(`SELECT snapshot_json FROM archives WHERE month = ?`).get(month)
  if (!archive) return res.status(404).json({ error: 'Archive not found' })
  res.json(JSON.parse(archive.snapshot_json))
})

router.get('/categories', (req, res) => {
  const rows = db.prepare(`SELECT category, COUNT(*) as count FROM domains WHERE status = 'active' GROUP BY category ORDER BY count DESC`).all()
  res.json(rows)
})

module.exports = router
