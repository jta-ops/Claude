require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const rateLimit  = require('express-rate-limit')
const scheduler  = require('./scheduler')

const listRouter       = require('./routes/list')
const submitRouter     = require('./routes/submit')
const auditRouter      = require('./routes/audit')
const signupRouter     = require('./routes/signup')
const schoolAuthRouter = require('./routes/schoolAuth')
const schoolRouter     = require('./routes/school')
const ownerRouter      = require('./routes/owner')

const app  = express()
const PORT = process.env.PORT || 3001

app.set('trust proxy', 1)

app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'https://schoolblock.codexyy.dev'],
  credentials: true,
}))

app.use(express.json({ limit: '1mb' }))

const submitLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false })
const auditLimiter  = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false })
const signupLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5,  standardHeaders: true, legacyHeaders: false })
const authLimiter   = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false })

app.get('/api/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }))

app.use('/api/list',        listRouter)
app.use('/api/submit',      submitLimiter, submitRouter)
app.use('/api/audit',       auditLimiter,  auditRouter)
app.use('/api/signup',      signupLimiter, signupRouter)

app.use('/api/school',      authLimiter, schoolAuthRouter)
app.use('/api/school',      schoolRouter)

app.use('/api/owner',       authLimiter, ownerRouter)

app.use('/api/admin',       ownerRouter)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`SchoolBlock API → http://localhost:${PORT}`)
  scheduler.start()
})
