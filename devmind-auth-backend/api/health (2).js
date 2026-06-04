export default function handler(req, res) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({
    ok: true,
    service: 'devmind-auth-backend',
    providers: {
      google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
    },
    publicBaseUrl: process.env.PUBLIC_BASE_URL || null,
    callback: process.env.DEVMIND_APP_CALLBACK || null
  }))
}
