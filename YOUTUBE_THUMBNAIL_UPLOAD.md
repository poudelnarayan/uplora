# YouTube Thumbnail Upload Implementation

## Overview

Extended the existing YouTube upload feature to support uploading custom thumbnails from Uplora to YouTube videos.

## Implementation Details

### 1. Enhanced Thumbnail Upload Service

**File:** `src/server/services/youtubeUploadService.ts`

- **`validateThumbnail(buffer, mimeType)`**: Validates thumbnail before upload

  - Checks MIME type (JPG, PNG, WEBP)
  - Enforces 2MB size limit
  - Validates minimum file size

- **`uploadYouTubeThumbnail(publisherUserId, youtubeVideoId, buffer, mimeType)`**: Main upload function
  - Validates thumbnail before upload
  - Handles OAuth token refresh automatically
  - Returns structured result with status and error info
  - Handles specific YouTube API errors (unverified channels, quota, etc.)
  - Retries on 401 (token expiration)

### 2. Thumbnail Upload Endpoint

**File:** `src/app/api/videos/[id]/youtube/thumbnail/route.ts`

- Accepts multipart form data with thumbnail file
- Validates file type (JPG, PNG, WEBP) and size (max 2MB)
- Stores upload status in database
- Returns detailed error messages

### 3. Integrated into Upload Flow

**Files:**

- `src/app/api/videos/[id]/approve/route.ts`
- `src/app/api/videos/[id]/youtube/upload/route.ts`

- Automatically uploads thumbnail after video upload succeeds
- Non-blocking: video upload doesn't fail if thumbnail upload fails
- Stores thumbnail upload status separately

## Database Schema Requirements

Add the following columns to the `video_posts` table:

```sql
-- Thumbnail upload status
ALTER TABLE video_posts
ADD COLUMN IF NOT EXISTS youtubeThumbnailUploadStatus TEXT
CHECK (youtubeThumbnailUploadStatus IN ('PENDING', 'SUCCESS', 'FAILED'));

-- Thumbnail upload error message (if failed)
ALTER TABLE video_posts
ADD COLUMN IF NOT EXISTS youtubeThumbnailUploadError TEXT;
```

## API Endpoints

### Upload Thumbnail (Standalone)

**POST** `/api/videos/[id]/youtube/thumbnail`

**Request:**

- `multipart/form-data` with `file` field
- File must be JPG, PNG, or WEBP
- Max size: 2MB

**Response:**

```json
{
  "ok": true,
  "status": "SUCCESS",
  "message": "Thumbnail uploaded successfully"
}
```

**Error Response:**

```json
{
  "ok": false,
  "status": "FAILED",
  "error": "Error message",
  "errorCode": "ERROR_CODE"
}
```

## Error Codes

- `VALIDATION_ERROR`: Invalid image format or size
- `AUTH_ERROR`: Failed to get YouTube access token
- `UNVERIFIED_CHANNEL`: YouTube channel is not verified
- `QUOTA_EXCEEDED`: YouTube API quota exceeded
- `AUTH_RETRY_FAILED`: Failed after token refresh retry
- `UPLOAD_ERROR`: General upload error
- `UNKNOWN_ERROR`: Unexpected error

## Usage Flow

1. **Video Upload**: Upload video to YouTube (existing flow)
2. **Automatic Thumbnail Upload**: If video has `thumbnailKey`, thumbnail is automatically uploaded after video upload succeeds
3. **Status Tracking**: Thumbnail upload status is stored in `youtubeThumbnailUploadStatus`
4. **Manual Upload**: Users can also upload thumbnails manually via `/api/videos/[id]/youtube/thumbnail` endpoint

## Features

✅ Validates image format (JPG, PNG, WEBP)  
✅ Enforces 2MB size limit  
✅ Automatic token refresh  
✅ Non-blocking (video upload doesn't fail if thumbnail fails)  
✅ Detailed error messages  
✅ Status tracking in database  
✅ Handles unverified channels gracefully  
✅ Production-ready error handling

## Security

- OAuth tokens never exposed to frontend
- Server-side validation of all inputs
- Automatic token refresh
- Secure S3 access for thumbnail retrieval
