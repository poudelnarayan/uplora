import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    // Check SMTP configuration
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER,
      from: process.env.SMTP_FROM || `Uplora <${process.env.SMTP_USER}>`,
      hasPassword: !!process.env.SMTP_PASS
    };

    console.log("🔍 Current SMTP Configuration:", smtpConfig);

    // Check if it looks like Fastmail
    const isFastmail = smtpConfig.host?.includes('fastmail');
    const isGmail = smtpConfig.host?.includes('gmail') || smtpConfig.user?.includes('gmail');

    const { testEmail } = await req.json();
    
    if (!testEmail) {
      return NextResponse.json({
        error: "Test email address required",
        smtpConfig: {
          ...smtpConfig,
          user: smtpConfig.user ? smtpConfig.user.replace(/(.{2}).+(@.+)/, '$1***$2') : 'Not set'
        }
      }, { status: 400 });
    }

    // Send test email
    console.log(`📧 Sending test email to: ${testEmail}`);
    
    const result = await sendEmail({
      to: testEmail,
      subject: "Uplora Fastmail Test Email",
      text: `Hello! This is a test email from Uplora using your new email configuration.
      
Configuration Details:
- SMTP Host: ${smtpConfig.host}
- SMTP Port: ${smtpConfig.port}
- Provider: ${isFastmail ? 'Fastmail' : isGmail ? 'Gmail' : 'Other'}
- From: ${smtpConfig.from}
- Sent at: ${new Date().toISOString()}

If you received this email, your Fastmail SMTP configuration is working correctly!`,
      html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a;">
        <h2>🎉 Uplora Email Test Successful!</h2>
        <p>Hello! This is a test email from Uplora using your new email configuration.</p>
        
        <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0;">
          <h3>Configuration Details:</h3>
          <ul>
            <li><strong>SMTP Host:</strong> ${smtpConfig.host}</li>
            <li><strong>SMTP Port:</strong> ${smtpConfig.port}</li>
            <li><strong>Provider:</strong> ${isFastmail ? '✅ Fastmail' : isGmail ? '⚠️ Gmail (Old)' : '❓ Other'}</li>
            <li><strong>From:</strong> ${smtpConfig.from}</li>
            <li><strong>Sent at:</strong> ${new Date().toISOString()}</li>
          </ul>
        </div>
        
        <p style="color:#059669;">✅ If you received this email, your ${isFastmail ? 'Fastmail' : 'email'} SMTP configuration is working correctly!</p>
        
        <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0;">
        <p style="color:#64748b;font-size:12px;">This is an automated test email from Uplora.</p>
      </body></html>`
    });

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      emailSent: true,
      smtpProvider: isFastmail ? 'Fastmail' : isGmail ? 'Gmail' : 'Other',
      smtpConfig: {
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        from: smtpConfig.from,
        user: smtpConfig.user ? smtpConfig.user.replace(/(.{2}).+(@.+)/, '$1***$2') : 'Not set'
      },
      result: {
        messageId: (result as any)?.messageId,
        accepted: (result as any)?.accepted,
        rejected: (result as any)?.rejected
      }
    });

  } catch (error) {
    console.error("❌ Fastmail test failed:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      smtpConfig: {
        host: process.env.SMTP_HOST || 'Not set',
        port: process.env.SMTP_PORT || 'Not set',
        secure: process.env.SMTP_SECURE || 'Not set',
        from: process.env.SMTP_FROM || `Uplora <${process.env.SMTP_USER}>`,
        user: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/(.{2}).+(@.+)/, '$1***$2') : 'Not set'
      }
    }, { status: 500 });
  }
}
