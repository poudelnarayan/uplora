import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { testType } = await req.json();
    
    const timestamp = new Date().toLocaleString();
    
    if (testType === "feedback") {
      // Test feedback email to feedback@uplora.io
      await sendMail({
        to: "feedback@uplora.io",
        subject: "📝 Test Feedback Submission",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:linear-gradient(135deg,#8b5cf6,#a855f7);color:white;padding:20px;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;font-size:24px;">📝 Test Feedback</h1>
              <p style="margin:8px 0 0;opacity:0.9;">Feedback Studio • Uplora</p>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
              <div style="background:#f3e8ff;border:1px solid #c084fc;border-radius:8px;padding:16px;margin-bottom:20px;">
                <h2 style="margin:0 0 12px;color:#7c3aed;">Test Feedback Submission</h2>
                <div style="font-size:14px;">
                  <p><strong>From:</strong> Test User</p>
                  <p><strong>Email:</strong> test@example.com</p>
                  <p><strong>Category:</strong> Bug Report</p>
                  <p><strong>Submitted:</strong> ${timestamp}</p>
                </div>
              </div>
              <div style="background:#f8fafc;border-radius:8px;padding:20px;">
                <h3 style="margin:0 0 12px;color:#374151;">Feedback Message:</h3>
                <p style="color:#4b5563;">This is a test feedback submission to verify the email routing system is working correctly. The feedback should be routed to feedback@uplora.io.</p>
              </div>
            </div>
          </div>
        `,
        text: `
📝 TEST FEEDBACK SUBMISSION
==========================
Category: Bug Report
From: Test User <test@example.com>
Submitted: ${timestamp}

Message:
This is a test feedback submission to verify the email routing system is working correctly.
        `
      });
      
      return NextResponse.json({ 
        success: true, 
        message: "Test feedback email sent to feedback@uplora.io",
        emailSent: true,
        timestamp 
      });
      
    } else if (testType === "idea") {
      // Test idea email to brainstorm@uplora.io
      await sendMail({
        to: "brainstorm@uplora.io",
        subject: "💡 Test Idea: Automated Testing Feature",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:linear-gradient(135deg,#f59e0b,#f97316);color:white;padding:20px;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;font-size:24px;">💡 New Idea Submission</h1>
              <p style="margin:8px 0 0;opacity:0.9;">Brainstorm • Uplora</p>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
              <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin-bottom:20px;">
                <h2 style="margin:0 0 12px;color:#92400e;">Automated Testing Feature</h2>
                <div style="font-size:14px;">
                  <p><strong>Priority:</strong> High</p>
                  <p><strong>From:</strong> Test User</p>
                  <p><strong>Submitted:</strong> ${timestamp}</p>
                </div>
              </div>
              <div style="background:#f8fafc;border-radius:8px;padding:20px;">
                <h3 style="margin:0 0 12px;color:#374151;">Idea Description:</h3>
                <p style="color:#4b5563;">This is a test idea submission to verify the email routing system. Ideas should be routed to brainstorm@uplora.io for the product team to review and prioritize.</p>
              </div>
            </div>
          </div>
        `,
        text: `
💡 TEST IDEA SUBMISSION
=======================
Title: Automated Testing Feature
Priority: High
From: Test User <test@example.com>
Submitted: ${timestamp}

Description:
This is a test idea submission to verify the email routing system is working correctly.
        `
      });
      
      return NextResponse.json({ 
        success: true, 
        message: "Test idea email sent to brainstorm@uplora.io",
        emailSent: true,
        timestamp 
      });
      
    } else if (testType === "invitation") {
      // Test team invitation email
      await sendMail({
        to: "test@example.com",
        subject: "You're invited to join \"Test Team\" on Uplora",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;padding:20px;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;font-size:24px;">Team Invitation</h1>
              <p style="margin:8px 0 0;opacity:0.9;">Uplora</p>
            </div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
              <h2 style="color:#1e293b;margin:0 0 16px;">You're invited to join "Test Team"</h2>
              <p style="color:#475569;margin:0 0 16px;">Test User has invited you to join the team as Editor.</p>
              <div style="background:#dbeafe;border:1px solid #93c5fd;border-radius:8px;padding:16px;margin:16px 0;">
                <p><strong>Team:</strong> Test Team</p>
                <p><strong>Role:</strong> Editor</p>
                <p><strong>Invited by:</strong> Test User</p>
                <p><strong>Test sent:</strong> ${timestamp}</p>
              </div>
              <div style="text-align:center;margin:20px 0;">
                <a href="#" style="background:#3b82f6;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600;">Accept Invitation</a>
              </div>
            </div>
          </div>
        `,
        text: `
TEAM INVITATION TEST
===================
You're invited to join "Test Team" on Uplora

Team: Test Team
Role: Editor
Invited by: Test User
Test sent: ${timestamp}

This is a test invitation email to verify the email system is working.
        `
      });
      
      return NextResponse.json({ 
        success: true, 
        message: "Test invitation email sent",
        emailSent: true,
        timestamp 
      });
    }
    
    return NextResponse.json({ error: "Invalid test type" }, { status: 400 });
    
  } catch (error) {
    console.error("Email test error:", error);
    return NextResponse.json({ 
      error: "Failed to send test email", 
      emailSent: false,
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}