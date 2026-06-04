import crypto from 'node:crypto'

const memoryStore = new Map()
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

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url')
}

export function signState(payload) {
  const secret = requiredEnv('SESSION_SECRET')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyState(state) {
  const secret = requiredEnv('SESSION_SECRET')
  const [body, sig] = String(state || '').split('.')
  if (!body || !sig) throw new Error('Invalid OAuth state')
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url')
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) throw new Error('Invalid OAuth state signature')
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  if (!payload.createdAt || Date.now() - payload.createdAt > DEFAULT_TTL_SECONDS * 1000) throw new Error('OAuth state expired')
  return payload
}

async function getKv() {
  try {
    const mod = await import('@vercel/kv')
    if (mod.kv && process.env.KV_REST_API_URL) return mod.kv
  } catch {}
  return null
}

export async function storeOneTimeCode(record, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const code = randomToken(24)
  const value = { ...record, createdAt: Date.now(), expiresAt: Date.now() + ttlSeconds * 1000 }
  const kv = await getKv()
  if (kv) await kv.set(`devmind:oauth:${code}`, value, { ex: ttlSeconds })
  else memoryStore.set(code, value)
  return code
}

export async function consumeOneTimeCode(code) {
  if (!code) throw new Error('Missing exchange code')
  const key = `devmind:oauth:${code}`
  const kv = await getKv()
  let value
  if (kv) {
    value = await kv.get(key)
    if (value) await kv.del(key)
  } else {
    value = memoryStore.get(code)
    memoryStore.delete(code)
  }
  if (!value) throw new Error('Invalid or expired exchange code')
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
