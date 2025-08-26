# Google OAuth Verification Guide for Uplora

## 🎯 **Verification Status: Ready to Submit**

Your YouTube OAuth integration is working perfectly! Now let's prepare for Google's verification process.

## 📋 **Pre-Verification Checklist**

### ✅ **1. Minimize Scopes (COMPLETED)**
- ✅ **Using least-privilege scope**: `https://www.googleapis.com/auth/youtube.upload`
- ✅ **Removed unnecessary scopes**: No longer requesting `youtube.readonly`
- ✅ **Justification provided**: See scope justification below

### ✅ **2. Consent Screen Setup**

**App Information:**
- **App name**: Uplora
- **Logo**: Use your app logo (upload to OAuth consent screen)
- **Support email**: `contact@uplora.io`
- **Developer contact email**: `contact@uplora.io`

**Authorized Domains:**
- ✅ `uplora.io`
- ✅ `www.uplora.io`
- ✅ `accounts.uplora.io` (if using Clerk subdomain)
- ✅ `clerk.uplora.io` (if using Clerk subdomain)

**URLs:**
- **Homepage URL**: `https://www.uplora.io`
- **Privacy Policy URL**: `https://www.uplora.io/privacy`
- **Terms of Service URL**: `https://www.uplora.io/terms`

### ✅ **3. Domain Verification**
- ✅ **Search Console**: Verify `uplora.io` ownership
- ✅ **Same Google account**: Use the account that owns the Cloud project

### ✅ **4. Scope Declaration**

**Add this scope to OAuth consent screen:**
- `https://www.googleapis.com/auth/youtube.upload` (Sensitive)

**Remove any unused scopes:**
- ❌ `youtube.readonly` (if present)
- ❌ `userinfo.email` (if present)
- ❌ `userinfo.profile` (if present)

## 📝 **Scope Justification**

**For `youtube.upload` (Sensitive scope):**

```
We request https://www.googleapis.com/auth/youtube.upload to let signed-in Uplora users upload videos to their own YouTube channel on demand. We only use this scope to create video uploads initiated by the user through our Upload interface. We store the Google OAuth refresh token encrypted server-side to renew access tokens for uploads; we do not read emails, contacts, or other data. We do not share Google user data with third parties except as necessary to provide the feature. Users can disconnect YouTube at any time from Settings → Social, which deletes stored tokens. We comply with Google API Services User Data Policy (Limited Use) and YouTube API Services Terms & Policies.
```

**Why narrower scopes aren't enough:**
- `youtube.readonly` only allows reading channel data, not uploading videos
- `youtube.force-ssl` is not sufficient for video uploads
- `youtube.upload` is the minimum required scope for video upload functionality

## 🔗 **Public Documentation Links**

**Feature Description:**
- **Upload Feature**: `https://www.uplora.io/upload`
- **Social Integration**: `https://www.uplora.io/social`
- **Settings Page**: `https://www.uplora.io/settings`

**Privacy Policy Requirements:**
Your privacy policy at `https://www.uplora.io/privacy` should include:

```markdown
## YouTube Integration

When you connect your YouTube account to Uplora:

**What we access:**
- Upload videos to your YouTube channel (only when you explicitly request an upload)

**What we DON'T access:**
- Your YouTube videos, playlists, or channel data
- Your email, contacts, or other Google account information
- Any data beyond what's necessary for video uploads

**How we store your data:**
- OAuth tokens are encrypted and stored securely on our servers
- We only use tokens to upload videos when you request it
- You can disconnect your YouTube account anytime from Settings → Social

**Data sharing:**
- We do not share your Google/YouTube data with third parties
- We only use the data to provide the upload functionality you requested
```

## 🎥 **Demo Video Requirements**

**Create an Unlisted YouTube video showing:**

1. **Sign-in Flow** (0:00-0:30)
   - User signs in to Uplora
   - Shows the app interface

2. **OAuth Consent Screen** (0:30-1:00)
   - Click "Connect YouTube" in Settings
   - Show Google OAuth consent screen
   - Highlight the app name "Uplora" is visible
   - Show browser address bar with your OAuth client ID: `737123665376-0dt0gs4k9js6h477gajrp8orokm0ormg.apps.googleusercontent.com`

3. **Scope Usage Demo** (1:00-2:30)
   - Go to Upload page
   - Select a video file
   - Show the upload process
   - Demonstrate the video uploads to YouTube via your app
   - Show the uploaded video appears on the user's YouTube channel

4. **Disconnect Feature** (2:30-3:00)
   - Show user can disconnect YouTube from Settings
   - Demonstrate the disconnect removes access

**Video Requirements:**
- ✅ **Unlisted on YouTube**
- ✅ **English narration**
- ✅ **Clear demonstration of scope usage**
- ✅ **Show the complete user flow**

## 🚀 **Submit for Verification**

### **Step 1: Prepare Your Submission**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Click **Submit for verification**

### **Step 2: Fill Out the Form**
- **App name**: Uplora
- **Scopes requested**: `https://www.googleapis.com/auth/youtube.upload`
- **Scope justification**: Use the justification above
- **Demo video URL**: Paste your unlisted YouTube video URL
- **Privacy policy URL**: `https://www.uplora.io/privacy`
- **Terms of service URL**: `https://www.uplora.io/terms`
- **Homepage URL**: `https://www.uplora.io`

### **Step 3: Submit and Monitor**
- ✅ **Submit the form**
- ✅ **Keep developer contact email current**
- ✅ **Respond to any Trust & Safety follow-ups within 24 hours**

## 📊 **Current Configuration Status**

### ✅ **Environment Variables (Production)**
```bash
GOOGLE_CLIENT_ID=737123665376-0dt0gs4k9js6h477gajrp8orokm0ormg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
YT_REDIRECT_URI=https://www.uplora.io/api/youtube/connect
```

### ✅ **OAuth Client Configuration**
- **Authorized JavaScript origins**: `https://www.uplora.io`, `https://www.uplora.io`
- **Authorized redirect URIs**: `https://www.uplora.io/api/youtube/connect`
- **Scope**: `https://www.googleapis.com/auth/youtube.upload`

### ✅ **App Status**
- **Publishing status**: In production
- **Verification status**: Ready to submit
- **Scopes**: Minimized to youtube.upload only

## 🎯 **Next Steps**

1. **Create the demo video** (most important)
2. **Update privacy policy** with YouTube integration details
3. **Submit for verification** using the form
4. **Monitor for follow-ups** from Google Trust & Safety

Your app is well-configured and ready for verification! 🚀
