# Uplora Split Apps

We split the platform into two deployable apps:

- apps/web → main product at www.uplora.io (existing code)
- apps/admin → admin portal at admin.uplora.io

## Admin app envs

- NEXTAUTH_URL=https://admin.uplora.io
- DATABASE_URL=postgres connection string (same DB as web)
- ADMIN_ALLOWED_EMAILS=kan077bct049@kec.edu.np

Optional bootstrap (one-time): ensure the admin user exists with a password in the users table.

## Run locally

```
cd apps/admin
npm i
npm run dev
```

Deploy apps/admin as a separate Vercel project, set envs above, and point domain admin.uplora.io to it.
