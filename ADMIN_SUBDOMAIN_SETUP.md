# Admin Subdomain Setup Guide

## Overview

This setup creates a dedicated admin portal accessible via subdomain with restricted access and enhanced security.

## URLs

### Production:

- **Admin Portal**: `https://admin.uplora.io`
- **Admin Login**: `https://admin.uplora.io/admin-login`
- **Admin Dashboard**: `https://admin.uplora.io/admin`

### Development/Testing:

- **Admin Portal**: `https://admin.uplora.vercel.app`
- **Admin Login**: `https://admin.uplora.vercel.app/admin-login`
- **Admin Dashboard**: `https://admin.uplora.vercel.app/admin`

## Features

### 🔒 **Security Features:**

- ✅ **Subdomain Isolation**: Admin portal completely separate from main app
- ✅ **Email/Password Only**: No Google OAuth on admin portal
- ✅ **Admin List Verification**: Only pre-approved emails can access
- ✅ **Session Monitoring**: All admin actions logged
- ✅ **Access Logging**: Login attempts and IP tracking
- ✅ **Route Protection**: Admin routes blocked on main domain

### 🎨 **UI Features:**

- ✅ **Dark Admin Theme**: Professional dark interface
- ✅ **Dedicated Layout**: Clean admin-only navigation
- ✅ **Loading States**: Proper feedback during operations
- ✅ **Error Handling**: Comprehensive error messages
- ✅ **Security Notices**: Visual indicators of admin mode

### 🛡️ **Access Control:**

- ✅ **Admin Verification**: Server-side admin status checking
- ✅ **Automatic Redirects**: Non-admins redirected to login
- ✅ **Session Management**: Secure admin sessions
- ✅ **Logout Handling**: Proper session cleanup

## Setup Instructions

### 1. DNS Configuration

#### For Production (admin.uplora.io):

```
Type: CNAME
Name: admin
Value: cname.vercel-dns.com
TTL: 3600
```

#### For Development (admin.uplora.vercel.app):

```
Type: CNAME
Name: admin
Value: cname.vercel-dns.com
TTL: 3600
```

### 2. Vercel Configuration

#### Environment Variables:

```bash
# Add these to your Vercel project
NEXTAUTH_URL=https://admin.uplora.io  # For admin subdomain
NEXTAUTH_SECRET=your-secret-here
```

#### Domain Configuration:

1. Go to Vercel Dashboard
2. Select your project
3. Go to "Settings" → "Domains"
4. Add `admin.uplora.io` (or `admin.uplora.vercel.app` for testing)

### 3. Admin User Setup

#### Create Admin Account:

1. **Sign up normally** on main domain with your admin email
2. **Set a strong password** during registration
3. **Verify your email** if required
4. **Access admin portal** with email/password

#### Admin Email Configuration:

Update the `ADMIN_EMAILS` array in these files:

- `src/app/api/admin/check/route.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/users/[id]/route.ts`
- `src/app/api/admin/auth/route.ts`

```typescript
const ADMIN_EMAILS = [
  "kan077bct049@kec.edu.np", // Your email
  // Add more admin emails here
];
```

## Usage

### Accessing Admin Portal:

1. **Navigate to**: `https://admin.uplora.io`
2. **You'll be redirected** to `/admin-login`
3. **Enter credentials**:
   - Email: `kan077bct049@kec.edu.np`
   - Password: Your account password
4. **Access admin dashboard** with full user management

### Admin Features:

- **User Management**: View, search, delete users
- **System Statistics**: User counts, team counts, video counts
- **Data Cleanup**: Complete user deletion with S3 cleanup
- **Audit Logging**: All actions logged for security

## Security Considerations

### 🔐 **Best Practices:**

- Use strong, unique passwords for admin accounts
- Regularly rotate admin passwords
- Monitor admin access logs
- Limit admin email list to essential personnel
- Use HTTPS for all admin communications

### 📊 **Monitoring:**

- Check Vercel function logs for admin actions
- Monitor failed login attempts
- Review user deletion logs
- Track S3 cleanup operations

### 🚨 **Emergency Procedures:**

- **Lock admin access**: Remove emails from `ADMIN_EMAILS` array
- **Reset admin password**: Use password reset on main domain
- **Audit logs**: Review all admin actions
- **Rollback changes**: Use database rollback if needed

## Troubleshooting

### Common Issues:

1. **DNS Not Working**:

   - Check CNAME record is correct
   - Wait for DNS propagation (up to 24 hours)
   - Verify domain in Vercel dashboard

2. **Login Fails**:

   - Verify email is in `ADMIN_EMAILS` array
   - Check password is correct
   - Ensure account exists in database

3. **Access Denied**:

   - Confirm admin status in database
   - Check session is valid
   - Verify admin check API is working

4. **Subdomain Not Loading**:
   - Check Vercel domain configuration
   - Verify middleware is working
   - Check for deployment issues

### Testing:

1. **Local Testing**: Use `localhost:3000/admin-login`
2. **Staging Testing**: Use `admin.uplora.vercel.app`
3. **Production**: Use `admin.uplora.io`

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── layout.tsx          # Admin layout with auth
│   │   └── page.tsx            # Admin dashboard
│   ├── admin-login/
│   │   └── page.tsx            # Admin login page
│   └── api/
│       └── admin/
│           ├── auth/
│           │   └── route.ts    # Admin authentication
│           ├── check/
│           │   └── route.ts    # Admin status check
│           └── users/
│               └── [id]/
│                   └── route.ts # User deletion
├── middleware-admin.ts         # Subdomain routing
└── middleware.ts              # Main app middleware
```

## Deployment

### Automatic Deployment:

- Push to main branch triggers deployment
- Vercel automatically deploys to both domains
- Admin subdomain gets same codebase with different routing

### Manual Deployment:

```bash
# Deploy to Vercel
vercel --prod

# Check deployment status
vercel ls
```

---

**Important**: This admin portal provides powerful system management capabilities. Use responsibly and ensure proper security measures are in place.
