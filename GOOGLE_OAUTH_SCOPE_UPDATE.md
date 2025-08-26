# Google OAuth Scope Update Guide

## 🔧 **Required Update: Add YouTube Readonly Scope**

The YouTube connection is failing because we need to request both `youtube.upload` and `youtube.readonly` scopes.

### **Step 1: Update Google Cloud Console OAuth Consent Screen**

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Navigate to**: `APIs & Services` → `OAuth consent screen`
3. **Click "Edit App"**
4. **In the "Scopes" section, add these scopes**:

```
https://www.googleapis.com/auth/youtube.upload
https://www.googleapis.com/auth/youtube.readonly
```

### **Step 2: Update Scope Justification**

**For `youtube.upload` (Sensitive scope):**
```
We request https://www.googleapis.com/auth/youtube.upload to let signed-in Uplora users upload videos to their own YouTube channel on demand. We only use this scope to create video uploads initiated by the user through our Upload interface.
```

**For `youtube.readonly` (Sensitive scope):**
```
We request https://www.googleapis.com/auth/youtube.readonly to fetch the user's YouTube channel information (channel name, ID) after they connect their account. This is necessary to display the connected channel name in our interface and verify the connection is working properly.
```

### **Step 3: Verify OAuth Client Configuration**

**Authorized JavaScript origins:**
- `http://localhost:3000`
- `https://uplora.vercel.app`
- `https://uplora.io`
- `https://www.uplora.io`

**Authorized redirect URIs:**
- `http://localhost:3000/api/youtube/connect`
- `https://uplora.vercel.app/api/youtube/connect`
- `https://www.uplora.io/api/youtube/connect`
- `https://uplora.io/api/youtube/connect`

### **Step 4: Test the Connection**

After updating the scopes:

1. **Go to**: `https://www.uplora.io/social`
2. **Click "Connect YouTube"**
3. **Authorize with Google** (should now show both scopes)
4. **Should redirect back to social page**
5. **Should show "Connected to YouTube" with channel name**

## 🎯 **Why This Fixes the Issue**

- **Previous**: Only requested `youtube.upload` scope
- **Problem**: Can't fetch channel info without `youtube.readonly`
- **Solution**: Request both scopes to handle uploads and channel info

## ✅ **Expected Result**

After this update:
- ✅ **YouTube connection** will work properly
- ✅ **Channel name** will be displayed
- ✅ **Error notifications** will show if something fails
- ✅ **Success notifications** will show when connected
