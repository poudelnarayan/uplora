const truncate = (str: string, max: number) => (str && str.length > max ? str.slice(0, max - 1) + "…" : str);
const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

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
  html: `<pre>${escapeHtml([
    `🎬 Uplora - New Publish Request`,
    ``,
    `Hi ${data.ownerName},`,
    ``,
    `${data.editorName} has uploaded a new video and is requesting approval to publish it.`,
    ``,
    `Video Details:`,
    `- Title: ${truncate(data.videoTitle, 70)}`,
    `- Team: ${data.teamName}`,
    `- Uploaded by: ${data.editorName}`,
    `- Status: Awaiting Your Approval`,
    ``,
    `Review the video here: ${data.videoUrl}`,
  ].join("\n"))}</pre>`,
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
  html: `<pre>${escapeHtml([
    `🎬 Uplora - Video Approved!`,
    ``,
    `Hi ${data.editorName},`,
    ``,
    `Great news! ${data.ownerName} has approved your video for publishing.`,
    ``,
    `Video Details:`,
    `- Title: ${data.videoTitle}`,
    `- Team: ${data.teamName}`,
    `- Status: ✅ Approved & Published`,
  ].join("\n"))}</pre>`,
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
  html: `<pre>${escapeHtml([
    `Reset your Uplora password`,
    ``,
    `We received a request to reset the password for ${data.email}.`,
    `If you made this request, use this link within 30 minutes:`,
    data.resetUrl,
    ``,
    `If you didn't request a password reset, you can safely ignore this email.`,
  ].join("\n"))}</pre>`,
  text: `Reset your Uplora password\n\nUse this link within 30 minutes: ${data.resetUrl}`,
});

export const welcomeEmailTemplate = (data: {
  userName: string;
  userEmail: string;
  dashboardUrl: string;
}) => {
  const text = `
🎬 Welcome to Uplora, ${data.userName}!

Get started: ${data.dashboardUrl}

Need help? Reply to this email.
This email was sent to ${data.userEmail} because you signed up for Uplora.
`.trim();

  return {
    subject: `Welcome to Uplora! 🎬 Let's create amazing content together`,
    html: `<pre>${escapeHtml(text)}</pre>`,
    text,
  };
};
