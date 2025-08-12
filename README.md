## Uplora – Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Set the following Environment Variables in Vercel (Project Settings → Environment Variables):

Required:

- NEXTAUTH_URL: `https://<your-domain>`
- NEXTAUTH_SECRET: long random string (e.g., run `openssl rand -base64 32`)
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET: from Google Cloud Console (enable YouTube Data API). Add redirect URIs:
  - `https://<your-domain>/api/auth/callback/google`
  - `http://localhost:3000/api/auth/callback/google` (for local dev)
- DATABASE_URL:
  - Local dev: `file:./prisma/dev.db` (SQLite)
  - Production: Postgres connection string (Vercel Postgres/Neon/Supabase), append `?sslmode=require` if needed
- AWS_REGION, S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
- NEXT_PUBLIC_SITE_URL: your site URL (e.g., `https://uplora.io`)

Optional (email for invites/notifications):

- EMAIL_SERVER and EMAIL_FROM
  or
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

3. Deploy. The build runs `prisma migrate deploy && next build`.

Notes:

- SSE endpoint `/api/events` and all S3 routes run on Node runtime in Vercel by default (configured in code).
- Thumbnails proxied via `/api/images/thumb` with long-lived cache + ETag.
- Middleware protects `/dashboard`, `/upload`, `/teams`, `/videos`, `/settings`, `/subscription` and redirects to `/signin` if unauthenticated.
