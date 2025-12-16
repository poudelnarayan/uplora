## Uplora – Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Set the following Environment Variables in Vercel (Project Settings → Environment Variables):

Required:

- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY: from Clerk dashboard
- NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase anon/public key
- SUPABASE_SERVICE_ROLE_KEY: Supabase service role key (server-only)
- AWS_REGION, S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
- NEXT_PUBLIC_SITE_URL: your site URL (e.g., `https://uplora.io`)
- IG_APP_ID, IG_APP_SECRET: from your Instagram app
- IG_REDIRECT_URI: must exactly match your whitelisted Instagram OAuth redirect (e.g., `http://localhost:3000/api/instagram/callback` and/or `https://<your-domain>/api/instagram/callback`)

Optional (email for invites/notifications):

- EMAIL_SERVER and EMAIL_FROM
  or
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

3. Deploy. The build runs `next build`.

Notes:

- SSE endpoint `/api/events` and all S3 routes run on Node runtime in Vercel by default (configured in code).
- Thumbnails proxied via `/api/images/thumb` with long-lived cache + ETag.
- Middleware enables Clerk auth context across routes. Access control is handled in route/layout logic.
