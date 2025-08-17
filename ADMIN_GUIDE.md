# Admin System Guide

## Overview

The admin system allows you to manage users, teams, and content across your Uplora application. This is similar to how major companies manage their platforms.

## Access Control

### Admin Access

- Only users with admin email addresses can access the admin dashboard
- Admin emails are configured in `/src/app/api/admin/check/route.ts`
- Current admin: `kan077bct049@kec.edu.np`

### Adding More Admins

To add more admin users, edit the `ADMIN_EMAILS` array in:

- `/src/app/api/admin/check/route.ts`
- `/src/app/api/admin/users/route.ts`
- `/src/app/api/admin/users/[id]/route.ts`

```typescript
const ADMIN_EMAILS = [
  "kan077bct049@kec.edu.np",
  // Add more admin emails here
];
```

## Admin Dashboard Features

### 1. User Management

- **View all users** with their details
- **Search users** by email or name
- **View user statistics** (teams owned, memberships, videos)
- **Delete users** with full data cleanup

### 2. System Statistics

- Total users count
- Total teams count
- Total videos count
- Admin access level indicator

### 3. User Actions

- **View Details**: See user's complete information
- **Delete User**: Permanently remove user and all associated data

## User Deletion Process

When you delete a user, the system performs a **complete cleanup**:

### What Gets Deleted:

1. **User Account** - Permanently removed
2. **User's Videos** - All videos owned by the user
3. **User's Teams** - All teams owned by the user (cascades to members and videos)
4. **Team Memberships** - User removed from all teams they joined
5. **Team Invites** - All invites sent by the user
6. **Upload Locks** - Any active upload sessions
7. **YouTube Connections** - YouTube tokens and channel data

### Safety Measures:

- **Self-Protection**: Admins cannot delete their own account
- **Confirmation Modal**: Double confirmation before deletion
- **Audit Logging**: All deletions are logged with details
- **Transaction Safety**: All operations use database transactions

## Accessing Admin Dashboard

### Method 1: Direct URL

Navigate to: `https://your-domain.com/admin`

### Method 2: Sidebar Link

- Admin users will see an "Admin Dashboard" link in the sidebar
- Located in a separate "Admin" section at the bottom

### Method 3: Navigation

- Only visible to admin users
- Automatically hidden for non-admin users

## Security Features

### 1. Access Control

- Server-side admin verification on all admin routes
- Client-side admin status checking
- Automatic redirect for non-admin users

### 2. Data Protection

- Admin cannot delete themselves
- Complete audit trail of all admin actions
- Secure API endpoints with proper authentication

### 3. Error Handling

- Graceful error handling for all operations
- User-friendly error messages
- Detailed server-side logging

## API Endpoints

### Admin Check

```
GET /api/admin/check
```

Returns: `{ isAdmin: boolean }`

### Get All Users

```
GET /api/admin/users
```

Returns: Array of users with team and video information

### Delete User

```
DELETE /api/admin/users/[userId]
```

Deletes user and all associated data

## Best Practices

### 1. User Management

- Always review user details before deletion
- Consider the impact on teams and videos
- Use search to find specific users quickly

### 2. Data Safety

- Deletions are permanent and cannot be undone
- Always confirm before deleting users
- Monitor the audit logs for suspicious activity

### 3. System Monitoring

- Regularly check the admin dashboard for system health
- Monitor user growth and activity
- Review team and video statistics

## Troubleshooting

### Common Issues:

1. **Admin Access Denied**

   - Check if your email is in the `ADMIN_EMAILS` array
   - Verify you're signed in with the correct account
   - Clear browser cache and try again

2. **User Not Found**

   - User may have already been deleted
   - Check the user list for current users
   - Refresh the admin dashboard

3. **Delete Operation Failed**
   - Check server logs for detailed error messages
   - Ensure database connection is stable
   - Try the operation again

### Getting Help:

- Check the server logs for detailed error information
- Review the audit trail for recent admin actions
- Contact system administrator if issues persist

## Future Enhancements

Potential features to add:

- User suspension (temporary ban)
- Bulk user operations
- Advanced filtering and sorting
- User activity logs
- Team management tools
- Video moderation tools
- System health monitoring
- Backup and restore functionality

## Compliance and Legal

### Data Protection

- All user deletions comply with data protection regulations
- Complete data removal ensures GDPR compliance
- Audit trails provide accountability

### Legal Considerations

- Ensure you have proper authorization to delete user accounts
- Consider legal requirements for data retention
- Maintain records of admin actions for compliance

---

**Important**: This admin system provides powerful tools for managing your platform. Use these features responsibly and in accordance with your platform's terms of service and applicable laws.
