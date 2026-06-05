import crypto from 'node:crypto'

const DEFAULT_TTL_SECONDS = 300

export function requiredEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export function getPublicBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '')
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const proto = req.headers['x-forwarded-proto'] || 'https'
  return `${proto}://${host}`
}

function base64url(input) {
  return Buffer.from(input).toString('base64url')
}

function fromBase64url(input) {
  return Buffer.from(String(input || ''), 'base64url')
}

function keyFromSecret() {
  return crypto.createHash('sha256').update(requiredEnv('SESSION_SECRET')).digest()
}

export function signState(payload) {
  const body = base64url(JSON.stringify(payload))
  const sig = crypto.createHmac('sha256', requiredEnv('SESSION_SECRET')).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyState(state) {
  const [body, sig] = String(state || '').split('.')
  if (!body || !sig) throw new Error('Invalid OAuth state')
  const expected = crypto.createHmac('sha256', requiredEnv('SESSION_SECRET')).update(body).digest('base64url')
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) throw new Error('Invalid OAuth state signature')
  const payload = JSON.parse(fromBase64url(body).toString('utf8'))
  if (!payload.createdAt || Date.now() - payload.createdAt > DEFAULT_TTL_SECONDS * 1000) throw new Error('OAuth state expired')
  return payload
}

export function sealExchangeRecord(record, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const iv = crypto.randomBytes(12)
  const key = keyFromSecret()
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const payload = Buffer.from(JSON.stringify({ ...record, createdAt: Date.now(), expiresAt: Date.now() + ttlSeconds * 1000 }), 'utf8')
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()])
  const tag = cipher.getAuthTag()
  return [base64url(iv), base64url(tag), base64url(encrypted)].join('.')
}

export function openExchangeRecord(code) {
  const [ivRaw, tagRaw, dataRaw] = String(code || '').split('.')
  if (!ivRaw || !tagRaw || !dataRaw) throw new Error('Invalid exchange code')
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyFromSecret(), fromBase64url(ivRaw))
  decipher.setAuthTag(fromBase64url(tagRaw))
  const decrypted = Buffer.concat([decipher.update(fromBase64url(dataRaw)), decipher.final()])
  const value = JSON.parse(decrypted.toString('utf8'))
  if (value.expiresAt && Date.now() > value.expiresAt) throw new Error('Exchange code expired')
  return value
}

export function redirect(res, location, status = 302) {
  res.statusCode = status
  res.setHeader('Location', location)
  res.end()
}

export function json(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

export function errorRedirect(res, provider, error) {
  const callback = process.env.DEVMIND_APP_CALLBACK || 'devmind://auth/callback'
  const params = new URLSearchParams({ provider, error: error?.message || String(error || 'OAuth failed') })
  redirect(res, `${callback}?${params}`)
}
