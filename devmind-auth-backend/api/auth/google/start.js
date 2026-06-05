import { getPublicBaseUrl, redirect, requiredEnv, signState } from '../../../lib/session.js'

export default function handler(req, res) {
  try {
    const baseUrl = getPublicBaseUrl(req)
    const state = signState({ provider: 'google', createdAt: Date.now() })
    const params = new URLSearchParams({
      client_id: requiredEnv('GOOGLE_CLIENT_ID'),
      redirect_uri: `${baseUrl}/api/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state
    })
    redirect(res, `https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  } catch (error) {
    res.statusCode = 500
    res.end(error.message)
  }
}
