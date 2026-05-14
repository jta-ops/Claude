const fetch = require('node-fetch')
const db = require('./db')

const PATTERNS = [
  () => { const n = rand(1, 9999); return [`ubg${n}.github.io`, `unblockedgames${n}.github.io`, `games${n}.github.io`] },
  () => { const n = rand(1, 99); return [`classroom${n}x.com`, `classroom${n}x.gg`, `class${n}games.com`] },
  () => {
    const prefixes = ['unblocked', 'free', 'school', 'no-block', 'bypass', 'play']
    const suffixes = ['games', 'arcade', 'fun', 'online', 'hub', 'portal']
    const tlds = ['.com', '.io', '.net', '.xyz', '.gg']
    return [`${pick(prefixes)}-${pick(suffixes)}${pick(tlds)}`, `${pick(prefixes)}${pick(suffixes)}${pick(tlds)}`, `${pick(prefixes)}.${pick(suffixes)}.io`]
  },
  () => { const n = rand(1, 9999); return [`games${n}.gitlab.io`, `unblocked${n}.gitlab.io`, `ubg${n}.gitlab.io`] },
  () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const id = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    return [`${id}.workers.dev`, `proxy-${id}.workers.dev`, `bypass-${id}.workers.dev`]
  },
  () => {
    const games = ['slope', 'polytrack', 'agario', '1v1lol', 'slopegame', 'drift-hunters']
    const g = pick(games)
    return [`${g}-unblocked.com`, `play-${g}.io`, `${g}-school.com`]
  },
  () => {
    const words = ['math', 'study', 'homework', 'learn', 'edu', 'quiz']
    const w = pick(words)
    return [`${w}-helper.com`, `${w}${rand(1, 99)}.live`, `my${w}help.com`]
  },
]

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function extractDomain(url) {
  try {
    const u = url.startsWith('http') ? url : `https://${url}`
    return new URL(u).hostname.replace(/^www\./, '')
  } catch { return url.replace(/^www\./, '').split('/')[0] }
}

async function fetchAndAnalyse(domain) {
  const keywords = db.prepare(`SELECT word FROM keywords WHERE active = 1`).all().map(r => r.word)
  const threshold = Number(db.prepare(`SELECT value FROM settings WHERE key = 'ai_threshold'`).get()?.value ?? 70)
  let fetchCode = null, bodyText = '', alive = false
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 7000)
    const resp = await fetch(`https://${domain}`, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SchoolBlock-Detector/1.0)', 'Accept': 'text/html' }, redirect: 'follow' })
    clearTimeout(timeout)
    fetchCode = resp.status
    if (resp.ok) { bodyText = await resp.text(); alive = true }
  } catch { fetchCode = 0 }
  if (!alive) return null
  const lowerBody = (bodyText + ' ' + domain).toLowerCase()
  const matched = keywords.filter(kw => lowerBody.includes(kw.toLowerCase()))
  const domainPatternScore = scoreDomainPattern(domain)
  const keywordScore = Math.min(60, matched.length * 12)
  const bodyLengthPenalty = bodyText.length < 300 ? -20 : 0
  const aiScore = Math.min(100, Math.max(0, domainPatternScore + keywordScore + bodyLengthPenalty))
  return { domain, url: `https://${domain}`, fetchCode, keywordMatches: matched, aiScore, status: aiScore >= threshold ? 'fasttrack' : 'pending' }
}

function scoreDomainPattern(domain) {
  let score = 0
  const d = domain.toLowerCase()
  const highSignal = ['unblock', 'game', 'proxy', 'bypass', 'ubg', 'classroom', 'slope', 'agar', 'roblox', 'cheat', 'hack', 'mirror', 'free-game']
  const medSignal  = ['play', 'fun', 'arcade', 'school', 'learn', 'math', 'quiz', 'study']
  for (const kw of highSignal) if (d.includes(kw)) score += 18
  for (const kw of medSignal)  if (d.includes(kw)) score += 8
  if (d.endsWith('.github.io') || d.endsWith('.gitlab.io')) score += 10
  if (d.endsWith('.workers.dev')) score += 12
  if (d.endsWith('.xyz') || d.endsWith('.gg') || d.endsWith('.live')) score += 6
  return Math.min(40, score)
}

function generateCandidates(count = 3) {
  const pattern = pick(PATTERNS)
  return pattern().sort(() => Math.random() - 0.5).slice(0, count)
}

async function runDetectionCycle() {
  const candidates = generateCandidates(3)
  console.log(`[detection] Probing: ${candidates.join(', ')}`)
  for (const raw of candidates) {
    const domain = extractDomain(raw)
    const existing = db.prepare(`SELECT id FROM domains WHERE domain = ?`).get(domain)
    const pending  = db.prepare(`SELECT id FROM submissions WHERE domain = ?`).get(domain)
    if (existing || pending) continue
    const result = await fetchAndAnalyse(domain)
    if (!result) { db.prepare(`INSERT INTO detection_log (domain, alive, outcome) VALUES (?, 0, 'dead')`).run(domain); continue }
    db.prepare(`INSERT OR IGNORE INTO submissions (url, domain, status, fetch_status_code, keyword_matches, ai_score, ai_reasoning) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(result.url, result.domain, result.status, result.fetchCode, JSON.stringify(result.keywordMatches), result.aiScore, 'auto-detection')
    db.prepare(`INSERT INTO detection_log (domain, alive, ai_score, keywords, outcome) VALUES (?, 1, ?, ?, ?)`).run(domain, result.aiScore, JSON.stringify(result.keywordMatches), result.status)
    console.log(`[detection] ${domain} → score ${result.aiScore} → ${result.status}`)
  }
}

module.exports = { runDetectionCycle }
