# Email Setup Guide for Uplora

## 🚨 Current Status: Development Mode

Your application is currently running in **development mode** for emails. This means:

- ✅ Email verification links are generated correctly
- ✅ Email content is logged to the console
- ❌ Emails are NOT actually sent to users
- 📝 You can see the email content in your terminal/logs

## 🔧 Email Configuration Options

### Option 1: Gmail SMTP (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Add to your `.env.local`**:

```bash
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Uplora <your-email@gmail.com>
```

### Option 2: Resend (Recommended for Production)

1. **Sign up at [resend.com](https://resend.com)**
2. **Get your API key** from the dashboard
3. **Add to your `.env.local`**:

```bash
# Resend Configuration
RESEND_API_KEY=re_your_api_key_here
SMTP_FROM=Uplora <noreply@yourdomain.com>
```

### Option 3: SendGrid

1. **Sign up at [sendgrid.com](https://sendgrid.com)**
2. **Create an API key**
3. **Add to your `.env.local`**:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.your_api_key_here
SMTP_FROM=Uplora <noreply@yourdomain.com>
```

### Option 4: Mailgun

1. **Sign up at [mailgun.com](https://mailgun.com)**
2. **Get your API key and domain**
3. **Add to your `.env.local`**:

```bash
# Mailgun Configuration
MAILGUN_API_KEY=key-your_api_key_here
MAILGUN_DOMAIN=your-domain.com
SMTP_FROM=Uplora <noreply@yourdomain.com>
```

## 🧪 Testing Email Configuration

### Test with Gmail (Quick Setup)

1. **Add Gmail SMTP to `.env.local`**:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Uplora <your-email@gmail.com>
```

2. **Restart your development server**:

```bash
npm run dev
```

3. **Test registration** - you should see:
   - ✅ "Email sent successfully" in console
   - ✅ Real email in your inbox

### Test Email API Directly

You can test the email API directly:

```bash
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "text": "This is a test email",
    "html": "<h1>Test Email</h1><p>This is a test email</p>"
  }'
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "Email sent successfully" but no email received

- Check spam/junk folder
- Verify SMTP credentials are correct
- Check if your email provider blocks the connection

#### 2. SMTP Connection Failed

- Verify SMTP_HOST and SMTP_PORT
- Check if your email provider requires specific settings
- Try different ports (587, 465, 25)

#### 3. Authentication Failed

- Verify SMTP_USER and SMTP_PASS
- For Gmail: Use App Password, not regular password
- Check if 2FA is enabled (required for App Passwords)

### Debug Mode

Enable SMTP debugging by adding to `.env.local`:

```bash
SMTP_DEBUG=true
```

This will show detailed SMTP connection logs in your console.

## 📧 Email Templates

The application sends these types of emails:

1. **Account Verification**: Sent after registration
2. **Password Reset**: (Future feature)
3. **Team Invitations**: (Future feature)

### Customizing Email Templates

Email templates are defined in:

- `src/app/api/auth/register/route.ts` - Registration verification
- `src/app/api/auth/resend-verification/route.ts` - Resend verification

## 🚀 Production Deployment

For production, we recommend:

1. **Resend** - Simple setup, good deliverability
2. **SendGrid** - Enterprise features, high volume
3. **Mailgun** - Developer-friendly, good pricing

### Environment Variables for Production

```bash
# Choose one email service:

# Option 1: Resend
RESEND_API_KEY=re_your_api_key_here
SMTP_FROM=Uplora <noreply@yourdomain.com>

# Option 2: SendGrid
SENDGRID_API_KEY=SG.your_api_key_here
SMTP_FROM=Uplora <noreply@yourdomain.com>

# Option 3: Gmail (not recommended for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Uplora <your-email@gmail.com>
```

## 📝 Current Development Workflow

Until you configure email:

1. **Register a new account**
2. **Check your terminal/console** for the email content
3. **Copy the verification link** from the console
4. **Paste it in your browser** to verify the account
5. **Sign in** with your credentials

The verification link format will be:

```
http://localhost:3000/api/auth/verify?token=YOUR_TOKEN_HERE
```

## 🎯 Next Steps

1. **Choose an email service** (Gmail for testing, Resend for production)
2. **Configure environment variables**
3. **Test email sending**
4. **Verify the complete registration flow**

Need help? Check the console logs for detailed information about what's happening with emails.
