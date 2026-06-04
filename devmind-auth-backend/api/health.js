export default function handler(req, res) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({
    ok: true,
    service: 'devmind-auth-backend',
    providers: {
      google: Boolean(process.env.GOOGLE_CLIENT_ID),
      github: Boolean(process.env.GITHUB_CLIENT_ID),
    },
  }))
}
