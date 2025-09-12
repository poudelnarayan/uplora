# Clerk Webhook Setup for Welcome Emails

This guide explains how to set up Clerk webhooks to automatically send welcome emails when users sign up.

## 1. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Clerk Webhook Secret (get this from Clerk Dashboard)
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App URL (for email links)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 2. Clerk Dashboard Setup

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks** in the left sidebar
3. Click **Add Endpoint**
4. Set the **Endpoint URL** to: `https://your-domain.com/api/webhooks/clerk`
5. Select the **Events** you want to listen for:
   - ✅ `user.created` (required for welcome emails)
6. Click **Create**
7. Copy the **Signing Secret** and add it to your environment variables as `CLERK_WEBHOOK_SECRET`

## 3. Testing the Welcome Email

### Option 1: Test with a real signup

1. Sign up a new user through your app
2. Check the terminal logs for webhook events
3. Check the user's email inbox

### Option 2: Test the email template directly

Send a POST request to `/api/test-welcome-email`:

```bash
curl -X POST https://your-domain.com/api/test-welcome-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'
```

## 4. Email Configuration

Make sure your SMTP settings are configured in your environment variables:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Narayan Poudel <narayan@uplora.com>"
```

## 5. What Happens When a User Signs Up

1. User completes signup in your app
2. Clerk sends a `user.created` webhook to `/api/webhooks/clerk`
3. The webhook handler:
   - Verifies the webhook signature
   - Extracts user information (name, email)
   - Generates a personalized welcome email
   - Sends the email via your SMTP configuration
   - Logs the result

## 6. Email Content

The welcome email includes:

- Personal greeting from Narayan Poudel (Creator)
- Overview of Uplora features
- Getting started tips
- Special welcome offer (14 days free)
- Direct link to dashboard
- Contact information

## 7. Troubleshooting

### Webhook not receiving events

- Check that the webhook URL is correct and accessible
- Verify the `CLERK_WEBHOOK_SECRET` is set correctly
- Check Clerk dashboard for webhook delivery status

### Emails not sending

- Verify SMTP configuration
- Check terminal logs for email sending errors
- Test with the `/api/test-welcome-email` endpoint

### Development Mode

In development, emails are logged to the console instead of being sent. Look for:

```
📧 DEVELOPMENT MODE - EMAIL WOULD BE SENT:
📧 TO: user@example.com
📧 SUBJECT: Welcome to Uplora! 🎬 Let's create amazing content together
```

## 8. Security Notes

- The webhook endpoint verifies Clerk's signature to ensure authenticity
- Only `user.created` events trigger welcome emails
- Email sending failures don't break the webhook (logged but not failed)
- User data is only used for personalizing the welcome email
