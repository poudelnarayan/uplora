# Environment Variables Update Guide

## 🔧 Update Required

You need to update your Google OAuth client secret in both local and production environments.

### 1. Local Environment (.env.local)

Update your `.env.local` file with:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=737123665376-0dt0gs4k9js6h477gajrp8orokm0ormg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
YT_REDIRECT_URI=https://www.uplora.io/api/youtube/connect

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Vercel Production Environment

Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

Update:
- `GOOGLE_CLIENT_SECRET` = `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`
- `YT_REDIRECT_URI` = `https://www.uplora.io/api/youtube/connect`

### 3. Key Changes Made

✅ **Simplified OAuth Scope**: Now only requests `youtube.upload` (removed `youtube.readonly`)
✅ **Added Diagnostic Logging**: Will help debug production issues
✅ **Updated Client Secret**: Using your new secret
✅ **Using YT_REDIRECT_URI**: Consistent redirect URI across all environments

### 4. Test the Changes

1. **Local**: `npm run dev` → Go to `/settings` → Click "Connect YouTube"
2. **Production**: After updating Vercel env vars → Go to `https://www.uplora.io/settings` → Click "Connect YouTube"

### 5. Check Logs

The diagnostic logs will show:
- Correct client ID: `737123665376-0dt0gs4k9js6h477gajrp8orokm0ormg.apps.googleusercontent.com`
- Correct scope: `https://www.googleapis.com/auth/youtube.upload`
- Correct redirect URI: `https://www.uplora.io/api/youtube/connect`

This should resolve the "Google hasn't verified this app" issue!
