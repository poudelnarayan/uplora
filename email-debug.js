const nodemailer = require("nodemailer");
require("dotenv").config({ path: ".env.local" });

async function debugEmail() {
  console.log("🔍 COMPREHENSIVE EMAIL DEBUGGING");
  console.log("=====================================");

  // 1. Check environment variables
  console.log("\n1. ENVIRONMENT VARIABLES:");
  console.log("SMTP_HOST:", process.env.SMTP_HOST || "NOT SET");
  console.log("SMTP_PORT:", process.env.SMTP_PORT || "NOT SET");
  console.log("SMTP_SECURE:", process.env.SMTP_SECURE || "NOT SET");
  console.log("SMTP_USER:", process.env.SMTP_USER || "NOT SET");
  console.log("SMTP_FROM:", process.env.SMTP_FROM || "NOT SET");
  console.log("SMTP_PASS:", process.env.SMTP_PASS ? "***SET***" : "NOT SET");

  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.error("❌ CRITICAL: Missing required SMTP configuration");
    return;
  }

  // 2. Test SMTP connection
  console.log("\n2. TESTING SMTP CONNECTION:");
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      logger: true,
      debug: true,
      tls: {
        servername: process.env.SMTP_HOST,
        rejectUnauthorized: false,
      },
    });

    console.log("🔧 Attempting SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection successful!");

    // 3. Test email sending with detailed logging
    console.log("\n3. TESTING EMAIL SENDING:");

    const testEmails = [
      {
        to: process.env.SMTP_USER, // Send to SMTP user
        subject: "Test 1: SMTP User Email",
        text: "This is a test email sent to the SMTP user address.",
        description: "SMTP User Address",
      },
      {
        to: "poudelnarayan434@gmail.com", // Send to Gmail
        subject: "Test 2: Gmail Address",
        text: "This is a test email sent to Gmail address.",
        description: "Gmail Address",
      },
      {
        to: "test@example.com", // Send to example.com
        subject: "Test 3: Example.com Address",
        text: "This is a test email sent to example.com address.",
        description: "Example.com Address",
      },
    ];

    for (const email of testEmails) {
      console.log(`\n📧 Testing: ${email.description}`);
      console.log(`To: ${email.to}`);

      try {
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: email.to,
          subject: email.subject,
          text: email.text,
          html: `
            <h1>${email.subject}</h1>
            <p>${email.text}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>From:</strong> ${process.env.SMTP_FROM}</p>
            <p><strong>To:</strong> ${email.to}</p>
          `,
          headers: {
            "X-Priority": "1",
            "X-MSMail-Priority": "High",
            Importance: "high",
            "X-Mailer": "Uplora/1.0",
            "List-Unsubscribe": `<mailto:${process.env.SMTP_USER}?subject=unsubscribe>`,
          },
          priority: "high",
        });

        console.log(`✅ Email sent successfully!`);
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   Response: ${info.response}`);
        console.log(`   Accepted: ${info.accepted}`);
        console.log(`   Rejected: ${info.rejected}`);
      } catch (error) {
        console.error(`❌ Email failed: ${error.message}`);
        console.error(`   Full error:`, error);
      }
    }

    // 4. Test with different ports
    console.log("\n4. TESTING DIFFERENT PORTS:");
    const ports = [465, 587, 25];

    for (const port of ports) {
      if (port === parseInt(process.env.SMTP_PORT)) continue; // Skip current port

      console.log(`\n🔧 Testing port ${port}...`);
      try {
        const testTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: port,
          secure: port === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            servername: process.env.SMTP_HOST,
            rejectUnauthorized: false,
          },
        });

        await testTransporter.verify();
        console.log(`✅ Port ${port} works!`);

        // Send test email on this port
        const info = await testTransporter.sendMail({
          from: process.env.SMTP_FROM,
          to: process.env.SMTP_USER,
          subject: `Test Port ${port}`,
          text: `This email was sent using port ${port}`,
        });

        console.log(`   Email sent via port ${port}: ${info.messageId}`);
      } catch (error) {
        console.log(`❌ Port ${port} failed: ${error.message}`);
      }
    }
  } catch (error) {
    console.error("❌ SMTP connection failed:", error.message);
    console.error("Full error:", error);
  }

  // 5. DNS and network diagnostics
  console.log("\n5. NETWORK DIAGNOSTICS:");
  const { exec } = require("child_process");

  exec(`nslookup ${process.env.SMTP_HOST}`, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ DNS lookup failed:", error.message);
    } else {
      console.log("✅ DNS lookup successful:");
      console.log(stdout);
    }
  });

  exec(`ping -c 3 ${process.env.SMTP_HOST}`, (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Ping failed:", error.message);
    } else {
      console.log("✅ Ping successful:");
      console.log(stdout);
    }
  });
}

debugEmail();
