# Authentication Troubleshooting Guide

## Common Issues After Deployment

### 1. Environment Variables Checklist

Make sure these environment variables are set in your Vercel project settings:

#### Required Variables:

```
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-long-random-secret-string
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DATABASE_URL=your-postgres-connection-string
```

#### Optional but Recommended:

```
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### 2. Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" > "Credentials"
4. Edit your OAuth 2.0 Client ID
5. Add these Authorized redirect URIs:
   - `https://your-domain.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for local development)

### 3. Database Issues

If you're using Vercel Postgres:

1. Make sure your database is properly provisioned
2. Check that migrations have run successfully
3. Verify the connection string format:
   ```
   postgresql://username:password@host:port/database?sslmode=require
   ```

### 4. Common Error Messages

#### "Invalid credentials" or "User not found"

- Check if the user exists in the database
- Verify email verification status
- Check database connection

#### "OAuth error" or Google sign-in fails

- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- Check redirect URIs in Google Cloud Console
- Ensure NEXTAUTH_URL matches your domain

#### "Internal server error"

- Check Vercel function logs
- Verify all environment variables are set
- Check database connectivity

### 5. Debugging Steps

1. **Check Vercel Function Logs:**

   - Go to your Vercel dashboard
   - Select your project
   - Go to "Functions" tab
   - Check logs for `/api/auth/*` functions

2. **Test Database Connection:**

   - Create a simple API route to test database connectivity
   - Check if Prisma can connect to your database

3. **Verify Environment Variables:**

   - Use Vercel CLI: `vercel env ls`
   - Check that all variables are properly set

4. **Test OAuth Flow:**
   - Try signing in with Google in an incognito window
   - Check browser console for any errors

### 6. Quick Fixes

#### If Google OAuth isn't working:

1. Double-check redirect URIs in Google Cloud Console
2. Ensure NEXTAUTH_URL is exactly your domain (no trailing slash)
3. Wait a few minutes after updating redirect URIs (Google caches them)

#### If email/password registration isn't working:

1. Check if email service is configured
2. Verify database migrations have run
3. Check if the user table exists and has the correct schema

#### If users can't log in after registration:

1. Check if email verification is required
2. Verify the verification email is being sent
3. Check if the verification link works

### 7. Testing Checklist

- [ ] Environment variables are set correctly
- [ ] Google OAuth redirect URIs are configured
- [ ] Database is accessible and migrations have run
- [ ] Email service is working (if using email verification)
- [ ] NEXTAUTH_URL matches your domain exactly
- [ ] No trailing slashes in URLs

### 8. Emergency Fixes

If authentication is completely broken:

1. **Temporarily disable email verification:**

   - Comment out email verification logic in registration
   - Allow users to sign in immediately after registration

2. **Use only Google OAuth:**

   - Temporarily disable credentials provider
   - Force users to use Google sign-in

3. **Check for CORS issues:**
   - Ensure your domain is properly configured
   - Check if there are any CORS errors in browser console

### 9. Getting Help

If you're still having issues:

1. Check the Vercel function logs for specific error messages
2. Verify all environment variables are correctly set
3. Test the authentication flow step by step
4. Check if the issue is specific to production or also happens locally

Remember: Most authentication issues are related to environment variables or OAuth configuration, not the code itself.
