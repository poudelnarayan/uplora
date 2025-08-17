# Local Testing Guide for Admin Subdomain

## Quick Start

### 1. Start Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

### 2. Test Admin Login

Navigate to: `http://localhost:3001/admin-login`

### 3. Test Admin Dashboard

After login: `http://localhost:3001/admin`

## Local Testing URLs

### ✅ **Working URLs (Local):**

- **Admin Login**: `http://localhost:3001/admin-login`
- **Admin Dashboard**: `http://localhost:3001/admin`
- **Main App**: `http://localhost:3001`

### ❌ **Blocked URLs (Local):**

- `http://localhost:3000/admin-login` (redirects to main app on main domain)

## Testing Steps

### Step 1: Create Admin Account

1. **Go to main app**: `http://localhost:3000`
2. **Sign up** with your admin email: `kan077bct049@kec.edu.np`
3. **Set a strong password** during registration
4. **Verify email** if required

### Step 2: Test Admin Login

1. **Navigate to**: `http://localhost:3000/admin-login`
2. **Enter credentials**:
   - Email: `kan077bct049@kec.edu.np`
   - Password: Your account password
3. **Click "Access Admin Panel"**

### Step 3: Test Admin Dashboard

1. **You should be redirected** to `/admin`
2. **Verify admin layout** appears (dark theme, admin navigation)
3. **Check user list** loads correctly
4. **Test search functionality**
5. **Test user deletion** (be careful!)

## Local Environment Setup

### 1. Environment Variables

Create `.env.local` file:

```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-local-secret-here"

# Google OAuth (for main app)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AWS S3 (for video deletion testing)
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="your-aws-region"
AWS_S3_BUCKET="your-s3-bucket"
```

### 2. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Optional: Seed with test data
npx prisma db seed
```

### 3. Install Dependencies

```bash
npm install
# or
yarn install
```

## Testing Scenarios

### ✅ **Test Case 1: Admin Login Success**

1. Navigate to `/admin-login`
2. Enter correct admin credentials
3. **Expected**: Redirect to `/admin` with admin layout

### ✅ **Test Case 2: Non-Admin Login**

1. Create account with non-admin email
2. Try to login at `/admin-login`
3. **Expected**: "Access Denied" message

### ✅ **Test Case 3: Admin Dashboard Access**

1. Login as admin
2. Navigate to `/admin`
3. **Expected**: See user list, admin navigation

### ✅ **Test Case 4: User Deletion**

1. Create test user account
2. Login as admin
3. Delete test user
4. **Expected**: User removed from database and S3

### ✅ **Test Case 5: Error Handling**

1. Try invalid credentials
2. **Expected**: Error message displayed
3. Try accessing admin without login
4. **Expected**: Redirect to login

## Debug Commands

### Check Database

```bash
# Open Prisma Studio
npx prisma studio

# Check database status
npx prisma db push

# Reset database (careful!)
npx prisma migrate reset
```

### Check API Endpoints

```bash
# Test admin check
curl http://localhost:3000/api/admin/check

# Test user list
curl http://localhost:3000/api/admin/users

# Test database connection
curl http://localhost:3000/api/debug/db-test
```

### Check Environment

```bash
# Test environment variables
curl http://localhost:3000/api/debug/env-check
```

## Common Local Issues

### 1. **Database Connection Error**

```bash
# Solution: Reset database
npx prisma migrate reset
npx prisma generate
```

### 2. **NextAuth Session Issues**

```bash
# Solution: Clear browser cookies
# Or restart dev server
npm run dev
```

### 3. **Admin Check Failing**

```bash
# Check admin email in code
# Verify email matches ADMIN_EMAILS array
```

### 4. **S3 Deletion Not Working**

```bash
# Check AWS credentials
# Verify S3 bucket permissions
# Check environment variables
```

## Local Development Tips

### 1. **Hot Reload Testing**

- Changes to admin components auto-reload
- API route changes require server restart
- Database changes require migration

### 2. **Console Logging**

- Check browser console for errors
- Check terminal for server logs
- Check Vercel function logs (if deployed)

### 3. **Network Tab**

- Monitor API requests
- Check authentication flow
- Verify admin check calls

### 4. **Database Inspection**

```bash
# Use Prisma Studio for visual DB inspection
npx prisma studio
```

## Testing Checklist

### ✅ **Pre-Testing Setup**

- [ ] Development server running
- [ ] Database connected
- [ ] Environment variables set
- [ ] Admin account created

### ✅ **Admin Login Testing**

- [ ] Login page loads
- [ ] Form validation works
- [ ] Admin authentication works
- [ ] Non-admin blocked
- [ ] Error messages display

### ✅ **Admin Dashboard Testing**

- [ ] Dashboard loads after login
- [ ] Admin layout appears
- [ ] User list displays
- [ ] Search functionality works
- [ ] Navigation works

### ✅ **User Management Testing**

- [ ] User deletion works
- [ ] S3 cleanup works
- [ ] Error handling works
- [ ] Rollback mechanism works

### ✅ **Security Testing**

- [ ] Non-admin access blocked
- [ ] Session management works
- [ ] Logout works
- [ ] Route protection works

## Performance Testing

### 1. **Load Testing**

```bash
# Test with multiple users
# Check admin dashboard performance
# Monitor database queries
```

### 2. **Memory Testing**

```bash
# Monitor memory usage
# Check for memory leaks


# Test large user lists
```

## Ready for Production

Once local testing is complete:

1. **Deploy to Vercel**
2. **Set up DNS records**
3. **Configure environment variables**
4. **Test on staging domain**
5. **Deploy to production**

---

**Happy Testing! 🚀**
