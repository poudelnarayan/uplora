# Google OAuth Setup Guide

## Updated Redirect URIs

After implementing the new authentication flow, you need to add these redirect URIs to your Google Cloud Console:

### For Basic Authentication (Sign In):

```
https://uplora.vercel.app/api/auth/callback/google
https://www.uplora.io/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

### For YouTube Connection (After Login):

```
https://uplora.vercel.app/api/youtube/connect
https://www.uplora.io/api/youtube/connect
http://localhost:3000/api/youtube/connect
```

## Setup Steps:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project**
3. **Navigate to**: APIs & Services → Credentials
4. **Edit your OAuth 2.0 Client ID**
5. **Add all the redirect URIs listed above**
6. **Save the changes**

## Environment Variables:

Make sure these are set in your Vercel project:

```
NEXTAUTH_URL=https://uplora.vercel.app
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## How It Works Now:

1. **Sign In**: Users can sign in with Google using basic profile scopes only
2. **Account Creation**: Basic account is created with email and name
3. **YouTube Connection**: After login, users can connect their YouTube channel separately
4. **Separate Permissions**: YouTube upload permissions are requested only when needed

## Benefits:

- ✅ Cleaner sign-in experience
- ✅ No overwhelming permission requests
- ✅ Users can connect YouTube later
- ✅ Better user onboarding flow
- ✅ Easier to add other platforms later

## Testing:

1. Test basic sign-in flow
2. Test YouTube connection from settings page
3. Verify that YouTube upload works after connection
