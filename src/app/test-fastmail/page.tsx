"use client";

import { useState } from "react";
import { useNotifications } from "@/components/ui/Notification";

export default function TestFastmailPage() {
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const notifications = useNotifications();

  const testFastmail = async () => {
    if (!testEmail) {
      notifications.addNotification({
        type: "error",
        title: "Email Required",
        message: "Please enter an email address to test"
      });
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const response = await fetch("/api/debug/test-fastmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail })
      });

      const data = await response.json();
      setResult(data);

      if (response.ok && data.success) {
        notifications.addNotification({
          type: "success",
          title: "Test Email Sent!",
          message: `Check ${testEmail} for the test email`
        });
      } else {
        notifications.addNotification({
          type: "error",
          title: "Test Failed",
          message: data.error || "Failed to send test email"
        });
      }
    } catch (error) {
      console.error("Test error:", error);
      notifications.addNotification({
        type: "error",
        title: "Network Error",
        message: "Failed to connect to the test API"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="card p-8">
          <h1 className="text-2xl font-bold mb-6 text-foreground">
            🧪 Fastmail SMTP Test
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Test your new Fastmail SMTP configuration by sending a test email.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Test Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              onClick={testFastmail}
              disabled={testing || !testEmail}
              className="btn btn-primary"
            >
              {testing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sending Test Email...
                </div>
              ) : (
                "Send Test Email"
              )}
            </button>
          </div>

          {result && (
            <div className="mt-6 p-4 border border-border rounded-lg bg-muted/30">
              <h3 className="font-semibold text-foreground mb-3">
                {result.success ? "✅ Test Results" : "❌ Test Failed"}
              </h3>
              
              {result.smtpConfig && (
                <div className="space-y-2 text-sm">
                  <p><strong>SMTP Host:</strong> {result.smtpConfig.host}</p>
                  <p><strong>SMTP Port:</strong> {result.smtpConfig.port}</p>
                  <p><strong>Provider:</strong> {result.smtpProvider || 'Unknown'}</p>
                  <p><strong>From Address:</strong> {result.smtpConfig.from}</p>
                  <p><strong>User:</strong> {result.smtpConfig.user}</p>
                </div>
              )}

              {result.error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  <strong>Error:</strong> {result.error}
                </div>
              )}

              {result.success && result.result && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                  <p><strong>Message ID:</strong> {result.result.messageId}</p>
                  <p><strong>Accepted:</strong> {JSON.stringify(result.result.accepted)}</p>
                  {result.result.rejected?.length > 0 && (
                    <p><strong>Rejected:</strong> {JSON.stringify(result.result.rejected)}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <h4 className="font-semibold mb-2">📋 Fastmail SMTP Settings</h4>
            <p>For reference, your production environment should have:</p>
            <ul className="mt-2 space-y-1 text-xs font-mono">
              <li>SMTP_HOST=smtp.fastmail.com</li>
              <li>SMTP_PORT=465</li>
              <li>SMTP_SECURE=true</li>
              <li>SMTP_USER=your-email@yourdomain.com</li>
              <li>SMTP_PASS=your-app-password</li>
              <li>SMTP_FROM=Uplora &lt;your-email@yourdomain.com&gt;</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
