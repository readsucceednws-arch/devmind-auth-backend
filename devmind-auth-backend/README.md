# DevMind Auth Backend

Stateless Vercel OAuth broker for DevMind Studio.

This version does not require Vercel KV. OAuth callback records are encrypted and signed into a short-lived one-time exchange payload using SESSION_SECRET.

Required env vars:

- PUBLIC_BASE_URL=https://devmind-auth-backend.vercel.app
- DEVMIND_APP_CALLBACK=devmind://auth/callback
- SESSION_SECRET=long-random-secret
- GOOGLE_CLIENT_ID=...
- GOOGLE_CLIENT_SECRET=...
- GITHUB_CLIENT_ID=...
- GITHUB_CLIENT_SECRET=...
