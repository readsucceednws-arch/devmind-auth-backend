import { errorRedirect, getPublicBaseUrl, redirect, requiredEnv, storeOneTimeCode, verifyState } from '../../../lib/session.js'

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
    const token = await fetchJson('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: requiredEnv('GITHUB_CLIENT_ID'),
        client_secret: requiredEnv('GITHUB_CLIENT_SECRET'),
        code: String(code || ''),
        redirect_uri: `${baseUrl}/api/auth/github/callback`
      })
    })
    const profile = await fetchJson('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github+json' }
    })
    const exchangeCode = await storeOneTimeCode({ provider: 'github', token, profile })
    const callback = process.env.DEVMIND_APP_CALLBACK || 'devmind://auth/callback'
    redirect(res, `${callback}?${new URLSearchParams({ provider: 'github', code: exchangeCode })}`)
  } catch (error) {
    errorRedirect(res, 'github', error)
  }
}
