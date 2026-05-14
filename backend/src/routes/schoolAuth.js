const { Router } = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production'

router.post('/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'email and password required' })

  const user = db.prepare(`SELECT * FROM school_users WHERE email = ?`).get(email)
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Your account has been suspended. Contact your school administrator.' })
  }

  const school = db.prepare(`SELECT * FROM schools WHERE id = ?`).get(user.school_id)
  if (!school || school.status === 'suspended') {
    return res.status(403).json({ error: 'Your school account is suspended. Contact SchoolBlock support.' })
  }

  db.prepare(`UPDATE school_users SET last_login = datetime('now') WHERE id = ?`).run(user.id)

  const token = jwt.sign(
    { id: user.id, email: user.email, schoolId: user.school_id, role: user.role, type: 'school' },
    JWT_SECRET,
    { expiresIn: '8h' }
  )

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    school: { id: school.id, name: school.name },
  })
})

router.post('/change-password', requireSchoolAuth, (req, res) => {
  const { current, newPassword } = req.body
  if (!current || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Current password and new password (min 8 chars) required' })
  }

  const user = db.prepare(`SELECT password_hash FROM school_users WHERE id = ?`).get(req.user.id)
  if (!bcrypt.compareSync(current, user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }

  db.prepare(`UPDATE school_users SET password_hash = ? WHERE id = ?`).run(bcrypt.hashSync(newPassword, 12), req.user.id)
  res.json({ ok: true })
})

function requireSchoolAuth(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET)
    if (payload.type !== 'school') return res.status(403).json({ error: 'Forbidden' })
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

module.exports = router
module.exports.requireSchoolAuth = requireSchoolAuth
