import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log("🧪 Sending simple invitation test to:", email);

    // Simple email without complex HTML
    const subject = "🎉 Simple Invitation Test from Uplora";
    const text = `
Hello!

This is a simple test invitation email from Uplora.

If you receive this email, it means the email delivery is working correctly.

Team: Test Team
Role: Editor
Link: http://localhost:3000/invite/test-token-123

Best regards,
Uplora Team

---
Sent at: ${new Date().toISOString()}
`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invitation Test</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #00ADB5;">🎉 Simple Invitation Test</h1>
        <p>Hello!</p>
        <p>This is a simple test invitation email from Uplora.</p>
        <p>If you receive this email, it means the email delivery is working correctly.</p>
        
        <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Team:</strong> Test Team</p>
            <p><strong>Role:</strong> Editor</p>
            <p><strong>Link:</strong> <a href="http://localhost:3000/invite/test-token-123" style="color: #00ADB5;">Accept Invitation</a></p>
        </div>
        
        <p>Best regards,<br>Uplora Team</p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">Sent at: ${new Date().toISOString()}</p>
    </div>
</body>
</html>
`;

    const result = await sendMail({
      to: email,
      subject,
      text,
      html,
    });

    console.log("✅ Simple invitation test sent:", result);

    return NextResponse.json({
      success: true,
      message: "Simple invitation test sent",
      details: {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
        response: result.response,
      }
    });

  } catch (error) {
    console.error("❌ Simple invitation test failed:", error);
    
    return NextResponse.json({
      success: false,
      error: "Failed to send simple invitation test",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
