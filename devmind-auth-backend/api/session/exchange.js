import { consumeOneTimeCode, json } from '../../lib/session.js'

function normalizeProfile(provider, profile) {
  if (provider === 'google') {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.picture,
      provider,
    }
  }
  if (provider === 'github') {
    return {
      id: profile.id,
      login: profile.login,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatar_url,
      provider,
    }
  }
  return { provider, ...profile }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, error: 'Method not allowed' })
  }
  try {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
    const record = await consumeOneTimeCode(body.code)
    return json(res, 200, {
      ok: true,
      provider: record.provider,
      profile: normalizeProfile(record.provider, record.profile || {}),
      accessToken: record.token?.access_token,
      refreshToken: record.token?.refresh_token,
      tokenType: record.token?.token_type,
      scope: record.token?.scope,
      expiresIn: record.token?.expires_in,
      issuedAt: record.createdAt,
    })
  } catch (error) {
    return json(res, 400, { ok: false, error: error.message || 'Could not exchange OAuth code' })
  }
}
