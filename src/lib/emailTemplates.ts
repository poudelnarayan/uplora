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

export const welcomeEmailTemplate = (data: {
  userName: string;
  userEmail: string;
  dashboardUrl: string;
}) => ({
  subject: `Welcome to Uplora! 🎬 Let's create amazing content together`,
  html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color:#2563eb;margin:0;font-size:28px;letter-spacing:.2px;">Uplora</h1>
        <p style="color: #6b7280; margin: 6px 0 0 0; font-size: 16px;">Content Creation & Management Platform</p>
      </div>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 32px; margin-bottom: 24px; color: white;">
        <h2 style="color: white; margin: 0 0 16px 0; font-size: 24px;">🎉 Welcome to Uplora, ${data.userName}!</h2>
        <p style="color: rgba(255,255,255,0.9); margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
          I'm <strong>Narayan Poudel</strong>, the creator of Uplora. I'm thrilled to have you join our community of content creators!
        </p>
        <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px; line-height: 1.6;">
          Uplora is designed to make your content creation journey seamless, from planning to publishing across all your social platforms.
        </p>
      </div>
      
      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h3 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">🚀 What you can do with Uplora:</h3>
        <div style="display: grid; gap: 16px;">
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <div style="background: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0;">1</div>
            <div>
              <h4 style="color: #1e293b; margin: 0 0 4px 0; font-size: 16px;">Create & Schedule Content</h4>
              <p style="color: #64748b; margin: 0; font-size: 14px;">Upload videos, images, and text posts. Schedule them for optimal engagement times.</p>
            </div>
          </div>
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <div style="background: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0;">2</div>
            <div>
              <h4 style="color: #1e293b; margin: 0 0 4px 0; font-size: 16px;">Team Collaboration</h4>
              <p style="color: #64748b; margin: 0; font-size: 14px;">Invite team members, manage roles, and collaborate on content creation workflows.</p>
            </div>
          </div>
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <div style="background: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0;">3</div>
            <div>
              <h4 style="color: #1e293b; margin: 0 0 4px 0; font-size: 16px;">Multi-Platform Publishing</h4>
              <p style="color: #64748b; margin: 0; font-size: 14px;">Connect your social accounts and publish to YouTube, Facebook, Instagram, and more.</p>
            </div>
          </div>
          <div style="display: flex; align-items: flex-start; gap: 12px;">
            <div style="background: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0;">4</div>
            <div>
              <h4 style="color: #1e293b; margin: 0 0 4px 0; font-size: 16px;">Analytics & Insights</h4>
              <p style="color: #64748b; margin: 0; font-size: 14px;">Track performance, engagement, and optimize your content strategy.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.dashboardUrl}" 
           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
          🚀 Get Started with Uplora
        </a>
      </div>
      
      <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h4 style="color: #475569; margin: 0 0 12px 0; font-size: 16px;">💡 Pro Tips to Get Started:</h4>
        <ul style="color: #64748b; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
          <li>Complete your profile setup in the onboarding flow</li>
          <li>Connect your social media accounts for seamless publishing</li>
          <li>Create your first post to test the platform</li>
          <li>Invite team members if you're working with others</li>
          <li>Explore the dashboard to understand all features</li>
        </ul>
      </div>
      
      <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h4 style="color: #92400e; margin: 0 0 8px 0; font-size: 16px;">🎁 Special Welcome Offer</h4>
        <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
          As a new user, you get <strong>14 days of free access</strong> to all premium features. No credit card required!
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0;">
          Need help? I'm here for you!
        </p>
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          <strong>Narayan Poudel</strong> - Creator of Uplora<br>
          <a href="mailto:narayan@uplora.com" style="color: #3b82f6; text-decoration: none;">narayan@uplora.com</a>
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 16px 0 0 0;">
          This email was sent to ${data.userEmail} because you signed up for Uplora.
        </p>
      </div>
    </div>
  `,
  text: `
    🎬 Welcome to Uplora, ${data.userName}!
    
    Hi there! I'm Narayan Poudel, the creator of Uplora. I'm thrilled to have you join our community of content creators!
    
    Uplora is designed to make your content creation journey seamless, from planning to publishing across all your social platforms.
    
    🚀 What you can do with Uplora:
    1. Create & Schedule Content - Upload videos, images, and text posts
    2. Team Collaboration - Invite team members and manage workflows  
    3. Multi-Platform Publishing - Connect social accounts and publish everywhere
    4. Analytics & Insights - Track performance and optimize strategy
    
    Get started: ${data.dashboardUrl}
    
    💡 Pro Tips:
    - Complete your profile setup in the onboarding flow
    - Connect your social media accounts
    - Create your first post to test the platform
    - Invite team members if working with others
    
    🎁 Special Welcome Offer:
    You get 14 days of free access to all premium features. No credit card required!
    
    Need help? I'm here for you!
    Narayan Poudel - Creator of Uplora
    narayan@uplora.com
    
    This email was sent to ${data.userEmail} because you signed up for Uplora.
  `
});
