# Clerk Authentication Setup Guide

## 🚀 Quick Setup Steps

### 1. Create Clerk Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Click "Create Application"
3. Choose your application name (e.g., "Uplora")
4. Select your authentication providers (Email, Google, etc.)
5. Click "Create Application"

### 2. Environment Variables

Add these to your `.env.local`:

```bash
# Clerk Configuration (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-publishable-key-here
CLERK_SECRET_KEY=sk_test_your-secret-key-here
```

**CRITICAL**: Both environment variables are required for Clerk to work properly:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Used by the frontend
- `CLERK_SECRET_KEY` - Used by the backend/API routes

### 3. Get Your Keys from Clerk Dashboard

1. In your Clerk Dashboard, go to "API Keys"
2. Copy the "Publishable key" (starts with `pk_test_` or `pk_live_`)
3. Copy the "Secret key" (starts with `sk_test_` or `sk_live_`)
4. Add both to your `.env.local` file

### 4. Clerk Dashboard Configuration

In your Clerk Dashboard:

- **Allowed redirect URLs**: Add your domains
  - `http://localhost:3000`
  - `https://your-domain.com`
- **Sign-in URL**: `/sign-in`
- **Sign-up URL**: `/sign-up`
- **After sign-in URL**: `/dashboard`
- **After sign-up URL**: `/dashboard`

## 🔧 Integration Benefits

### ✅ What Clerk Provides

- **Built-in UI Components**: Ready-to-use sign-in/sign-up forms
- **Email Verification**: Automatic email verification handling
- **Multi-factor Authentication**: Built-in 2FA support
- **User Management**: Advanced user profile management
- **Session Management**: Secure session handling
- **Social Login**: Easy Google, GitHub, Discord integration
- **Security**: Built-in protection against common attacks

## 🎯 Expected Results

- **Faster Development**: No custom auth code needed
- **Better UX**: Professional authentication UI
- **Enhanced Security**: Industry-standard protection
- **Easy Maintenance**: Clerk handles updates and security

## 🚨 Troubleshooting

If you see "headers was called outside a request scope" error:

1. **Check environment variables** are set correctly
2. **Restart your development server** after adding environment variables
3. **Verify both keys** are present in `.env.local`
4. **Check for typos** in environment variable names

## 📋 Next Steps After Environment Setup

1. Get your Clerk keys from the dashboard
2. Add them to `.env.local`
3. Restart your development server
4. Test the authentication flow
5. Configure additional settings as needed