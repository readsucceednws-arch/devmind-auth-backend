# Setup Guide

## 1. Create a GitHub repo

1. Go to https://github.com/new
2. Repository name: `devmind-auth-backend`
3. Choose Private or Public.
4. Create repository.
5. Upload the contents of this folder, or run:

```bash
git init
git add .
git commit -m "Initial DevMind auth backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/devmind-auth-backend.git
git push -u origin main
```

## 2. Import into Vercel

1. Go to https://vercel.com/new
2. Import your `devmind-auth-backend` GitHub repo.
3. Framework preset: Other.
4. Deploy.

## 3. Add environment variables in Vercel

Project Settings -> Environment Variables:

```env
PUBLIC_BASE_URL=https://YOUR_PROJECT.vercel.app
DEVMIND_APP_CALLBACK=devmind://auth/callback
SESSION_SECRET=make-a-long-random-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

## 4. Set provider callback URLs

Google redirect URI:

```txt
https://YOUR_PROJECT.vercel.app/api/auth/google/callback
```

GitHub callback URL:

```txt
https://YOUR_PROJECT.vercel.app/api/auth/github/callback
```

## 5. Connect DevMind

DevMind should open:

```txt
https://YOUR_PROJECT.vercel.app/api/auth/google/start
https://YOUR_PROJECT.vercel.app/api/auth/github/start
```

Then DevMind receives:

```txt
devmind://auth/callback?provider=google&code=ONE_TIME_CODE
```

Then DevMind exchanges code by POSTing:

```txt
https://YOUR_PROJECT.vercel.app/api/session/exchange
```

Body:

```json
{ "code": "ONE_TIME_CODE" }
```

## Important production note

For production serverless deployments, add Vercel KV storage. Without KV, local/dev fallback memory may lose codes between serverless invocations.
