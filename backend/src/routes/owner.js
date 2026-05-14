const { Router } = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production'

function requireOwner(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET)
    if (payload.type !== 'owner') return res.status(403).json({ error: 'Owner access required' })
    req.admin = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

router.post('/login', (req, res) => {
  const { username, password } = req.body
  const admin = db.prepare(`SELECT * FROM admins WHERE username = ?`).get(username)
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  db.prepare(`UPDATE admins SET last_login = datetime('now') WHERE id = ?`).run(admin.id)
  const token = jwt.sign({ id: admin.id, username: admin.username, type: 'owner' }, JWT_SECRET, { expiresIn: '8h' })
  res.json({ token, username: admin.username })
})

router.use(requireOwner)

router.get('/stats', (req, res) => {
  const domains     = db.prepare(`SELECT COUNT(*) as n FROM domains WHERE status = 'active'`).get().n
  const fasttrack   = db.prepare(`SELECT COUNT(*) as n FROM submissions WHERE status = 'fasttrack'`).get().n
  const pending     = db.prepare(`SELECT COUNT(*) as n FROM submissions WHERE status = 'pending'`).get().n
  const schools     = db.prepare(`SELECT COUNT(*) as n FROM schools WHERE status = 'active'`).get().n
  const signupsPend = db.prepare(`SELECT COUNT(*) as n FROM school_signups WHERE status = 'pending'`).get().n
  const todayDet    = db.prepare(`SELECT COUNT(*) as n FROM detection_log WHERE ran_at >= date('now')`).get().n
  const recentDetections = db.prepare(`SELECT domain, outcome, ai_score, ran_at FROM detection_log ORDER BY ran_at DESC LIMIT 10`).all()
  res.json({ domains, fasttrack, pending, schools, signupsPending: signupsPend, todayDetections: todayDet, recentDetections })
})

router.get('/queue/fasttrack', (req, res) => {
  res.json(db.prepare(`SELECT * FROM submissions WHERE status = 'fasttrack' ORDER BY submitted_at DESC LIMIT 100`).all())
})

router.get('/queue/pending', (req, res) => {
  res.json(db.prepare(`SELECT * FROM submissions WHERE status = 'pending' ORDER BY submitted_at DESC LIMIT 100`).all())
})

router.post('/queue/:id/approve', (req, res) => {
  const { category, notes } = req.body
  const sub = db.prepare(`SELECT * FROM submissions WHERE id = ?`).get(req.params.id)
  if (!sub) return res.status(404).json({ error: 'Submission not found' })
  const month = new Date().toISOString().slice(0, 7)
  try {
    db.prepare(`INSERT INTO domains (url, domain, category, added_month, notes, ai_score, keyword_hits, source) VALUES (?, ?, ?, ?, ?, ?, ?, 'user-report')`).run(sub.url, sub.domain, (category || 'GAMES').toUpperCase(), month, notes || null, sub.ai_score, 0)
  } catch (e) {
    if (!e.message.includes('UNIQUE')) throw e
  }
  db.prepare(`UPDATE submissions SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?`).run(req.admin.id, sub.id)
  res.json({ ok: true, domain: sub.domain })
})

router.post('/queue/:id/reject', (req, res) => {
  db.prepare(`UPDATE submissions SET status = 'rejected', reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?`).run(req.admin.id, req.params.id)
  res.json({ ok: true })
})

router.get('/signups', (req, res) => {
  const { status = 'pending' } = req.query
  res.json(db.prepare(`SELECT * FROM school_signups WHERE status = ? ORDER BY created_at DESC`).all(status))
})

router.post('/signups/:id/approve', (req, res) => {
  const { password } = req.body
  if (!password || password.length < 8) return res.status(400).json({ error: 'Initial password (min 8 chars) required' })
  const signup = db.prepare(`SELECT * FROM school_signups WHERE id = ? AND status = 'pending'`).get(req.params.id)
  if (!signup) return res.status(404).json({ error: 'Signup not found or already processed' })
  const schoolStmt = db.prepare(`INSERT INTO schools (name, country, region, student_count, contact_name, contact_email, contact_phone, approved_by, approved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`)
  const userStmt = db.prepare(`INSERT INTO school_users (school_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, 'admin')`)
  let schoolId
  db.transaction(() => {
    const result = schoolStmt.run(signup.school_name, signup.country, signup.region, signup.student_count, signup.contact_name, signup.contact_email, signup.contact_phone, req.admin.id)
    schoolId = result.lastInsertRowid
    userStmt.run(schoolId, signup.contact_name, signup.contact_email, bcrypt.hashSync(password, 12))
    db.prepare(`UPDATE school_signups SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?`).run(req.admin.id, signup.id)
  })()
  res.json({ ok: true, schoolId, message: `School approved. First login: ${signup.contact_email} / [password you set]` })
})

router.post('/signups/:id/reject', (req, res) => {
  db.prepare(`UPDATE school_signups SET status = 'rejected', reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?`).run(req.admin.id, req.params.id)
  res.json({ ok: true })
})

router.get('/schools', (req, res) => {
  res.json(db.prepare(`SELECT s.*, COUNT(u.id) as user_count FROM schools s LEFT JOIN school_users u ON u.school_id = s.id GROUP BY s.id ORDER BY s.created_at DESC`).all())
})

router.get('/schools/:id', (req, res) => {
  const school = db.prepare(`SELECT * FROM schools WHERE id = ?`).get(req.params.id)
  if (!school) return res.status(404).json({ error: 'Not found' })
  const users = db.prepare(`SELECT id, name, email, role, status, last_login FROM school_users WHERE school_id = ?`).all(req.params.id)
  res.json({ ...school, users })
})

router.patch('/schools/:id', (req, res) => {
  const { status } = req.body
  db.prepare(`UPDATE schools SET status = COALESCE(?, status) WHERE id = ?`).run(status || null, req.params.id)
  res.json({ ok: true })
})

router.get('/domains', (req, res) => {
  const { category, status = 'active', q, limit = 50, offset = 0 } = req.query
  let sql = `SELECT * FROM domains WHERE status = ?`
  const params = [status]
  if (category) { sql += ` AND category = ?`; params.push(category.toUpperCase()) }
  if (q)        { sql += ` AND domain LIKE ?`; params.push(`%${q}%`) }
  sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
  params.push(Number(limit), Number(offset))
  const rows = db.prepare(sql).all(...params)
  const total = db.prepare(`SELECT COUNT(*) as n FROM domains WHERE status = 'active'`).get().n
  res.json({ total, rows })
})

router.post('/domains', (req, res) => {
  const { url, domain, category, notes } = req.body
  if (!domain || !category) return res.status(400).json({ error: 'domain and category required' })
  const month = new Date().toISOString().slice(0, 7)
  try {
    db.prepare(`INSERT INTO domains (url, domain, category, added_month, notes, source) VALUES (?, ?, ?, ?, ?, 'manual')`).run(url || `https://${domain}`, domain, category.toUpperCase(), month, notes || null)
    res.json({ ok: true })
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Domain already exists' })
    throw e
  }
})

router.patch('/domains/:id', (req, res) => {
  const { category, notes, status } = req.body
  db.prepare(`UPDATE domains SET category = COALESCE(?, category), notes = COALESCE(?, notes), status = COALESCE(?, status), updated_at = datetime('now') WHERE id = ?`).run(category || null, notes || null, status || null, req.params.id)
  res.json({ ok: true })
})

router.delete('/domains/:id', (req, res) => {
  db.prepare(`UPDATE domains SET status = 'removed', updated_at = datetime('now') WHERE id = ?`).run(req.params.id)
  res.json({ ok: true })
})

router.post('/domains/bulk', (req, res) => {
  const { domains, category = 'GAMES' } = req.body
  if (!Array.isArray(domains)) return res.status(400).json({ error: 'domains[] required' })
  const month = new Date().toISOString().slice(0, 7)
  const insert = db.prepare(`INSERT OR IGNORE INTO domains (url, domain, category, added_month, source) VALUES (?, ?, ?, ?, 'manual')`)
  let added = 0
  db.transaction((list) => {
    for (const d of list) {
      const dom = d.trim().replace(/^www\./, '')
      if (!dom) continue
      insert.run(`https://${dom}`, dom, category.toUpperCase(), month)
      added++
    }
  })(domains)
  res.json({ ok: true, added })
})

router.get('/keywords', (req, res) => res.json(db.prepare(`SELECT * FROM keywords ORDER BY word`).all()))

router.post('/keywords', (req, res) => {
  const { word } = req.body
  if (!word) return res.status(400).json({ error: 'word required' })
  try {
    db.prepare(`INSERT INTO keywords (word) VALUES (?)`).run(word.toLowerCase().trim())
    res.json({ ok: true })
  } catch { res.status(409).json({ error: 'Keyword already exists' }) }
})

router.patch('/keywords/:id', (req, res) => {
  const { active } = req.body
  db.prepare(`UPDATE keywords SET active = ? WHERE id = ?`).run(active ? 1 : 0, req.params.id)
  res.json({ ok: true })
})

router.delete('/keywords/:id', (req, res) => {
  db.prepare(`DELETE FROM keywords WHERE id = ?`).run(req.params.id)
  res.json({ ok: true })
})

router.get('/detection-log', (req, res) => {
  const { limit = 50, outcome } = req.query
  let sql = `SELECT * FROM detection_log`
  const params = []
  if (outcome) { sql += ` WHERE outcome = ?`; params.push(outcome) }
  sql += ` ORDER BY ran_at DESC LIMIT ?`
  params.push(Number(limit))
  res.json(db.prepare(sql).all(...params))
})

router.get('/settings', (req, res) => {
  const rows = db.prepare(`SELECT key, value FROM settings`).all()
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])))
})

router.patch('/settings', (req, res) => {
  const upsert = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`)
  db.transaction(obj => { for (const [k, v] of Object.entries(obj)) upsert.run(k, String(v)) })(req.body)
  res.json({ ok: true })
})

router.post('/publish', (req, res) => {
  const month = new Date().toISOString().slice(0, 7)
  const domains = db.prepare(`SELECT * FROM domains WHERE status = 'active'`).all()
  db.prepare(`INSERT OR REPLACE INTO archives (month, snapshot_json) VALUES (?, ?)`).run(month, JSON.stringify({ month, count: domains.length, domains }))
  res.json({ ok: true, month, count: domains.length })
})

module.exports = router
