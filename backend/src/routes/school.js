const { Router } = require('express')
const bcrypt = require('bcryptjs')
const { randomUUID } = require('crypto')
const db = require('../db')
const { requireSchoolAuth } = require('./schoolAuth')

const router = Router()
router.use(requireSchoolAuth)

router.get('/overview', (req, res) => {
  const { schoolId } = req.user
  const totalDomains = db.prepare(`SELECT COUNT(*) as n FROM domains WHERE status = 'active'`).get().n
  const lastAudit = db.prepare(`SELECT token, completed_at, results_json FROM audit_sessions WHERE school_id = ? AND completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT 1`).get(schoolId)
  const userCount = db.prepare(`SELECT COUNT(*) as n FROM school_users WHERE school_id = ? AND status = 'active'`).get(schoolId).n
  const pendingSubmissions = db.prepare(`SELECT COUNT(*) as n FROM submissions WHERE school_id = ? AND status = 'pending'`).get(schoolId).n
  let lastScore = null
  if (lastAudit?.results_json) { try { lastScore = JSON.parse(lastAudit.results_json).score } catch {} }
  res.json({ totalDomains, lastAudit: lastAudit ? { token: lastAudit.token, completedAt: lastAudit.completed_at, score: lastScore } : null, userCount, pendingSubmissions })
})

router.get('/users', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'School admin only' })
  res.json(db.prepare(`SELECT id, name, email, role, status, created_at, last_login FROM school_users WHERE school_id = ? ORDER BY created_at DESC`).all(req.user.schoolId))
})

router.post('/users', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'School admin only' })
  const { name, email, role = 'member', password } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password required' })
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
  try {
    db.prepare(`INSERT INTO school_users (school_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`).run(req.user.schoolId, name, email, bcrypt.hashSync(password, 12), role)
    res.json({ ok: true })
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'A user with that email already exists' })
    throw e
  }
})

router.patch('/users/:id', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'School admin only' })
  const { role, status, name } = req.body
  const user = db.prepare(`SELECT id FROM school_users WHERE id = ? AND school_id = ?`).get(req.params.id, req.user.schoolId)
  if (!user) return res.status(404).json({ error: 'User not found' })
  db.prepare(`UPDATE school_users SET role = COALESCE(?, role), status = COALESCE(?, status), name = COALESCE(?, name) WHERE id = ? AND school_id = ?`).run(role || null, status || null, name || null, req.params.id, req.user.schoolId)
  res.json({ ok: true })
})

router.delete('/users/:id', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'School admin only' })
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot remove yourself' })
  const user = db.prepare(`SELECT id FROM school_users WHERE id = ? AND school_id = ?`).get(req.params.id, req.user.schoolId)
  if (!user) return res.status(404).json({ error: 'User not found' })
  db.prepare(`UPDATE school_users SET status = 'suspended' WHERE id = ?`).run(req.params.id)
  res.json({ ok: true })
})

router.get('/audits', (req, res) => {
  const sessions = db.prepare(`SELECT token, list_size, created_at, completed_at, results_json FROM audit_sessions WHERE school_id = ? ORDER BY created_at DESC LIMIT 20`).all(req.user.schoolId)
  const parsed = sessions.map(s => {
    let score = null, grade = null
    if (s.results_json) { try { const r = JSON.parse(s.results_json); score = r.score; grade = r.grade } catch {} }
    return { token: s.token, listSize: s.list_size, createdAt: s.created_at, completedAt: s.completed_at, score, grade }
  })
  res.json(parsed)
})

router.get('/downloads', (req, res) => {
  const formats = [
    { name: 'JSON',       url: '/api/list/current',       description: 'Full structured list with categories and metadata' },
    { name: 'Plain text', url: '/api/list/current.txt',   description: 'One domain per line — Pi-hole, Squid, most firewalls' },
    { name: 'CSV',        url: '/api/list/current.csv',   description: 'Spreadsheet-friendly with category column' },
    { name: 'hosts file', url: '/api/list/current.hosts', description: '0.0.0.0 format — /etc/hosts, Pi-hole' },
  ]
  const total = db.prepare(`SELECT COUNT(*) as n FROM domains WHERE status = 'active'`).get().n
  res.json({ total, formats })
})

router.get('/submissions', (req, res) => {
  res.json(db.prepare(`SELECT id, domain, status, submitted_at, ai_score FROM submissions WHERE school_id = ? ORDER BY submitted_at DESC LIMIT 50`).all(req.user.schoolId))
})

router.get('/me', (req, res) => {
  const user = db.prepare(`SELECT id, name, email, role, school_id FROM school_users WHERE id = ?`).get(req.user.id)
  const school = db.prepare(`SELECT id, name, country, region, student_count, contact_email FROM schools WHERE id = ?`).get(req.user.schoolId)
  res.json({ user, school })
})

module.exports = router
