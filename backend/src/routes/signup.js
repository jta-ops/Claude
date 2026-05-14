const { Router } = require('express')
const db = require('../db')

const router = Router()

router.post('/', (req, res) => {
  const { school_name, country, region, student_count, contact_name, contact_email, contact_phone, reason } = req.body
  if (!school_name || !contact_name || !contact_email) {
    return res.status(400).json({ error: 'school_name, contact_name and contact_email are required' })
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRe.test(contact_email)) return res.status(400).json({ error: 'Invalid email address' })
  const existing = db.prepare(`SELECT id FROM schools WHERE contact_email = ?`).get(contact_email)
  if (existing) return res.status(409).json({ error: 'An account with that email already exists.' })
  const dupe = db.prepare(`SELECT id, status FROM school_signups WHERE contact_email = ?`).get(contact_email)
  if (dupe) {
    if (dupe.status === 'pending')  return res.status(409).json({ error: 'A signup request from this email is already pending review.' })
    if (dupe.status === 'approved') return res.status(409).json({ error: 'This email is already approved.' })
    if (dupe.status === 'rejected') return res.status(409).json({ error: 'This signup request was previously declined. Contact us to appeal.' })
  }
  db.prepare(`INSERT INTO school_signups (school_name, country, region, student_count, contact_name, contact_email, contact_phone, reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(school_name, country || null, region || null, student_count || null, contact_name, contact_email, contact_phone || null, reason || null)
  res.json({ ok: true, message: 'Your request has been submitted. You will be contacted when it is reviewed.' })
})

module.exports = router
