import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const { message, category, includeEmail, path, teamId, teamName } = await req.json();

    if (!message || typeof message !== "string" || message.trim().length < 3) {
      return NextResponse.json({ error: "Feedback message required" }, { status: 400 });
    }

    const userEmail = includeEmail ? (session?.user?.email || "anonymous@local") : "anonymous@local";
    const to = process.env.FEEDBACK_TO || process.env.SMTP_USER || "developer@local";
    const subject = `Feedback (${category || "General"}) from ${session?.user?.email || "Anonymous"}`;

    const text = [
      `Feedback category: ${category || "General"}`,
      `From: ${session?.user?.name || "Anonymous"} <${userEmail}>`,
      `Page: ${path || "unknown"}`,
      `Team: ${teamName || teamId || "none"}`,
      "",
      message,
    ].join("\n");

    const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <h2 style="margin:0 0 8px;">New Feedback</h2>
      <p><strong>Category:</strong> ${category || "General"}</p>
      <p><strong>From:</strong> ${session?.user?.name || "Anonymous"} &lt;${userEmail}&gt;</p>
      <p><strong>Page:</strong> ${path || "unknown"}</p>
      <p><strong>Team:</strong> ${teamName || teamId || "none"}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0;" />
      <pre style="white-space:pre-wrap;font:inherit;">${escapeHtml(message)}</pre>
    </body></html>`;

    // Relay to send-email endpoint (which already handles SMTP + fallback logging)
    const base = process.env.NEXTAUTH_URL || "";
    await fetch(`${base}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, text, html }),
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
