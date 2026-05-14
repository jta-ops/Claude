const SCHOOL_KEY = 'sb_school_token'
const OWNER_KEY  = 'sb_owner_token'

export function getSchoolToken()  { return localStorage.getItem(SCHOOL_KEY) }
export function getOwnerToken()   { return localStorage.getItem(OWNER_KEY) }
export function setSchoolToken(t) { localStorage.setItem(SCHOOL_KEY, t) }
export function setOwnerToken(t)  { localStorage.setItem(OWNER_KEY, t) }
export function clearSchoolToken(){ localStorage.removeItem(SCHOOL_KEY) }
export function clearOwnerToken() { localStorage.removeItem(OWNER_KEY) }

export function schoolHeaders() {
  const t = getSchoolToken()
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

export function ownerHeaders() {
  const t = getOwnerToken()
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

export async function schoolFetch(path, opts = {}) {
  const res = await fetch(path, { ...opts, headers: { ...schoolHeaders(), ...(opts.headers || {}) } })
  if (res.status === 401) { clearSchoolToken(); window.location.href = '/login' }
  return res
}

export async function ownerFetch(path, opts = {}) {
  const res = await fetch(path, { ...opts, headers: { ...ownerHeaders(), ...(opts.headers || {}) } })
  if (res.status === 401) { clearOwnerToken(); window.location.href = '/owner/login' }
  return res
}
