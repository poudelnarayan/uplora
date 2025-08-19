import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    // Get environment variables
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER,
      from: process.env.SMTP_FROM || `Uplora <${process.env.SMTP_USER}>`,
      hasPassword: !!process.env.SMTP_PASS,
      passwordLength: process.env.SMTP_PASS?.length || 0
    };

    console.log("🔍 Production SMTP Configuration Check:", smtpConfig);

    // Validate configuration
    const missingVars = [];
    if (!process.env.SMTP_HOST) missingVars.push('SMTP_HOST');
    if (!process.env.SMTP_PORT) missingVars.push('SMTP_PORT');
    if (!process.env.SMTP_USER) missingVars.push('SMTP_USER');
    if (!process.env.SMTP_PASS) missingVars.push('SMTP_PASS');

    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing environment variables: ${missingVars.join(', ')}`,
        smtpConfig: {
          ...smtpConfig,
          user: smtpConfig.user ? smtpConfig.user.replace(/(.{2}).+(@.+)/, '$1***$2') : 'Not set'
        }
      }, { status: 400 });
    }

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
    console.log(`📧 Sending production test email to: ${testEmail}`);
    console.log(`📧 From: ${smtpConfig.from}`);
    
    const result = await sendEmail({
      to: testEmail,
      subject: "Uplora Production Email Test",
      text: `Hello! This is a test email from Uplora production.
      
Configuration Details:
- SMTP Host: ${smtpConfig.host}
- SMTP Port: ${smtpConfig.port}
- SMTP Secure: ${smtpConfig.secure}
- From: ${smtpConfig.from}
- Sent at: ${new Date().toISOString()}

If you received this email, your production email configuration is working correctly!`,
      html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a;">
        <h2>🎉 Uplora Production Email Test</h2>
        <p>Hello! This is a test email from Uplora production environment.</p>
        
        <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:16px 0;">
          <h3>Configuration Details:</h3>
          <ul>
            <li><strong>SMTP Host:</strong> ${smtpConfig.host}</li>
            <li><strong>SMTP Port:</strong> ${smtpConfig.port}</li>
            <li><strong>SMTP Secure:</strong> ${smtpConfig.secure}</li>
            <li><strong>From:</strong> ${smtpConfig.from}</li>
            <li><strong>Environment:</strong> Production</li>
            <li><strong>Sent at:</strong> ${new Date().toISOString()}</li>
          </ul>
        </div>
        
        <p style="color:#059669;">✅ If you received this email, your production email configuration is working correctly!</p>
        
        <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0;">
        <p style="color:#64748b;font-size:12px;">This is a test email from Uplora production.</p>
      </body></html>`
    });

    console.log("✅ Production test email sent successfully!");
    console.log("📊 Result:", {
      messageId: (result as any)?.messageId,
      accepted: (result as any)?.accepted,
      rejected: (result as any)?.rejected
    });

    return NextResponse.json({
      success: true,
      message: "Production test email sent successfully",
      emailSent: true,
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
    console.error("❌ Production email test failed:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      smtpConfig: {
        host: process.env.SMTP_HOST || 'Not set',
        port: process.env.SMTP_PORT || 'Not set',
        secure: process.env.SMTP_SECURE || 'Not set (defaulting to true)',
        from: process.env.SMTP_FROM || `Uplora <${process.env.SMTP_USER}>`,
        user: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/(.{2}).+(@.+)/, '$1***$2') : 'Not set',
        hasPassword: !!process.env.SMTP_PASS,
        passwordLength: process.env.SMTP_PASS?.length || 0
      }
    }, { status: 500 });
  }
}
