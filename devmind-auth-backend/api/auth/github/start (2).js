import { getPublicBaseUrl, redirect, requiredEnv, signState } from '../../../lib/session.js'

export default function handler(req, res) {
  try {
    const baseUrl = getPublicBaseUrl(req)
    const state = signState({ provider: 'github', createdAt: Date.now() })
    const params = new URLSearchParams({
      client_id: requiredEnv('GITHUB_CLIENT_ID'),
      redirect_uri: `${baseUrl}/api/auth/github/callback`,
      scope: 'read:user user:email repo',
      state
    })
    redirect(res, `https://github.com/login/oauth/authorize?${params}`)
  } catch (error) {
    res.statusCode = 500
    res.end(error.message)
  }
}
