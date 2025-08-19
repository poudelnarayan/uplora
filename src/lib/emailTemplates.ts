const truncate = (str: string, max: number) => (str && str.length > max ? str.slice(0, max - 1) + "…" : str);

export const publishRequestTemplate = (data: {
  editorName: string;
  videoTitle: string;
  teamName: string;
  videoUrl: string;
  ownerName: string;
}) => {
  const truncatedTitle = truncate(data.videoTitle, 35);

  return {
  subject: `Publish Request: "${truncatedTitle}" from ${data.editorName}`,
  html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color:#2563eb;margin:0;font-size:22px;letter-spacing:.2px;">Uplora</h1>
        <p style="color: #6b7280; margin: 6px 0 0 0; font-size: 13px;">Team Video Management</p>
      </div>
      
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #1e293b; margin: 0 0 14px 0;">New Publish Request</h2>
        <p style="color: #475569; margin: 0 0 16px 0;">Hi ${data.ownerName},</p>
        <p style="color: #475569; margin: 0 0 16px 0;">
          <strong>${data.editorName}</strong> has uploaded a new video and is requesting approval to publish it.
        </p>
        
        <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #1e293b; margin: 0 0 10px 0;">Video Details</h3>
          <p style="margin: 0 0 8px 0;"><strong>Title:</strong> ${truncate(data.videoTitle, 70)}</p>
          <p style="margin: 0 0 8px 0;"><strong>Team:</strong> ${data.teamName}</p>
          <p style="margin: 0 0 8px 0;"><strong>Uploaded by:</strong> ${data.editorName}</p>
          <p style="margin: 0;"><strong>Status:</strong> Awaiting Your Approval</p>
        </div>
      </div>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="${data.videoUrl}" 
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
          Review & Approve Video
        </a>
      </div>
      
      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h4 style="color: #475569; margin: 0 0 8px 0;">What you can do:</h4>
        <ul style="color: #64748b; margin: 0; padding-left: 20px;">
          <li>Preview the video and check quality</li>
          <li>Review metadata (title, description, etc.)</li>
          <li>Approve for publishing to YouTube</li>
          <li>Request changes if needed</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 14px; margin: 0;">
          This email was sent by Uplora team management system.
        </p>
      </div>
    </div>
  `,
  text: `
    🎬 Uplora - New Publish Request
    
    Hi ${data.ownerName},
    
     ${data.editorName} has uploaded a new video and is requesting approval to publish it.
    
    Video Details:
     - Title: ${truncatedTitle}
    - Team: ${data.teamName}
    - Uploaded by: ${data.editorName}
    - Status: Awaiting Your Approval
    
    Review the video here: ${data.videoUrl}
    
    You can preview the video, review metadata, and approve for publishing to YouTube.
  `
};
};

export const publishApprovedTemplate = (data: {
  editorName: string;
  videoTitle: string;
  teamName: string;
  ownerName: string;
}) => ({
  subject: `✅ Video Published: "${truncate(data.videoTitle, 70)}"`,
  html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color:#2563eb;margin:0;font-size:22px;letter-spacing:.2px;">Uplora</h1>
        <p style="color: #6b7280; margin: 6px 0 0 0; font-size: 13px;">Team Video Management</p>
      </div>
      
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <h2 style="color: #166534; margin: 0 0 16px 0;">✅ Video Approved!</h2>
        <p style="color: #166534; margin: 0 0 16px 0;">Hi ${data.editorName},</p>
        <p style="color: #166534; margin: 0 0 16px 0;">
          Great news! <strong>${data.ownerName}</strong> has approved your video for publishing.
        </p>
        
        <div style="background: white; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #166534; margin: 0 0 8px 0;">📄 Video Details</h3>
          <p style="margin: 4px 0;"><strong>Title:</strong> ${data.videoTitle}</p>
          <p style="margin: 4px 0;"><strong>Team:</strong> ${data.teamName}</p>
          <p style="margin: 4px 0;"><strong>Status:</strong> ✅ Approved & Published</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 14px; margin: 0;">
          This email was sent by Uplora team management system.
        </p>
      </div>
    </div>
  `,
  text: `
    🎬 Uplora - Video Approved!
    
    Hi ${data.editorName},
    
    Great news! ${data.ownerName} has approved your video for publishing.
    
    Video Details:
    - Title: ${data.videoTitle}
    - Team: ${data.teamName}
    - Status: ✅ Approved & Published
  `
});

export const passwordResetTemplate = (data: { resetUrl: string; email: string }) => ({
  subject: `Reset your Uplora password`,
  html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color:#2563eb;margin:0;font-size:22px;letter-spacing:.2px;">Uplora</h1>
        <p style="color: #6b7280; margin: 6px 0 0 0; font-size: 13px;">Password Reset</p>
      </div>
      <p style="color:#334155">We received a request to reset the password for <strong>${data.email}</strong>.</p>
      <p style="color:#334155">If you made this request, click the button below to set a new password. This link will expire in 30 minutes.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${data.resetUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
      </div>
      <p style="color:#64748b;font-size:13px">If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
  `,
  text: `Reset your Uplora password\n\nUse this link within 30 minutes: ${data.resetUrl}`,
});
