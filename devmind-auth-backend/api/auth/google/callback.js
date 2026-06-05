import { errorRedirect, getPublicBaseUrl, redirect, requiredEnv, sealExchangeRecord, verifyState } from '../../../lib/session.js'

async function fetchJson(url, options) {
  const response = await fetch(url, options)
  const text = await response.text()
  let payload = {}
  try { payload = text ? JSON.parse(text) : {} } catch { payload = { raw: text } }
  if (!response.ok || payload.error) throw new Error(payload.error_description || payload.error || `Request failed: ${response.status}`)
  return payload
}

export default async function handler(req, res) {
  try {
    const { code, state, error } = req.query || {}
    if (error) throw new Error(String(error))
    verifyState(state)
    const baseUrl = getPublicBaseUrl(req)
    const token = await fetchJson('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: requiredEnv('GOOGLE_CLIENT_ID'),
        client_secret: requiredEnv('GOOGLE_CLIENT_SECRET'),
        code: String(code || ''),
        grant_type: 'authorization_code',
        redirect_uri: `${baseUrl}/api/auth/google/callback`
      })
    })
    const profile = await fetchJson('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` }
    })
    const exchangeCode = sealExchangeRecord({ provider: 'google', token, profile })
    const callback = process.env.DEVMIND_APP_CALLBACK || 'devmind://auth/callback'
    redirect(res, `${callback}?${new URLSearchParams({ provider: 'google', code: exchangeCode })}`)
  } catch (error) {
    errorRedirect(res, 'google', error)
  }
}
