export default function handler(req, res) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify({
    ok: true,
    service: 'devmind-auth-backend',
    message: 'DevMind OAuth backend is deployed. Use /api/health or /api/auth/google/start.'
  }))
}
