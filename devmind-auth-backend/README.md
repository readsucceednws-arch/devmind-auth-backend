# DevMind OAuth Backend

Small Vercel backend that keeps Google/GitHub OAuth secrets out of the DevMind desktop app.

## Flow

DevMind desktop -> Vercel `/start` endpoint -> Google/GitHub login -> Vercel callback -> `devmind://auth/callback?code=...` -> DevMind exchanges one-time code at `/api/session/exchange`.

## Required Vercel Environment Variables

```env
PUBLIC_BASE_URL=https://your-project.vercel.app
DEVMIND_APP_CALLBACK=devmind://auth/callback
SESSION_SECRET=replace-with-long-random-string
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Google Cloud Redirect URI

```txt
https://your-project.vercel.app/api/auth/google/callback
```

## GitHub OAuth Callback URL

```txt
https://your-project.vercel.app/api/auth/github/callback
```

## Notes

- Do not commit real secrets.
- For production scale, connect Vercel KV in the Vercel dashboard. This template falls back to short-lived in-memory storage for local/dev, but serverless production should use KV.
- The desktop app should open `/api/auth/google/start` or `/api/auth/github/start`.
