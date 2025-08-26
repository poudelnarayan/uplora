"use client";

import { useState } from "react";
import { useNotifications } from "@/components/ui/Notification";

export default function TestEmailDirect() {
  const [testEmail, setTestEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const notifications = useNotifications();

  const handleTestEmail = async () => {
    if (!testEmail) {
      notifications.addNotification({
        type: "error",
        title: "Email Required",
        message: "Please enter an email address to test"
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-email-direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testEmail }),
      });

      const data = await response.json();
      setResult(data);

      if (response.ok) {
        notifications.addNotification({
          type: "success",
          title: "Test Emails Sent!",
          message: "Check your email, feedback@uplora.io, and brainstorm@uplora.io for test emails"
        });
      } else {
        notifications.addNotification({
          type: "error",
          title: "Test Failed",
          message: data.error || "Failed to send test emails"
        });
      }
    } catch (error) {
      console.error("Test email error:", error);
      notifications.addNotification({
        type: "error",
        title: "Test Failed",
        message: "Failed to send test emails"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🧪 Email System Test
          </h1>

          <div className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Your Email Address (to test delivery)
              </label>
              <input
                type="email"
                id="testEmail"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your-email@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Test Button */}
            <button
              onClick={handleTestEmail}
              disabled={isLoading || !testEmail}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? "Sending Test Emails..." : "Send Test Emails"}
            </button>

            {/* What this test does */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What this test does:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Sends a test email to <strong>feedback@uplora.io</strong></li>
                <li>• Sends a test email to <strong>brainstorm@uplora.io</strong></li>
                <li>• Sends a test email to <strong>your email address</strong></li>
                <li>• Checks your SMTP configuration</li>
                <li>• Shows detailed results below</li>
              </ul>
            </div>

            {/* Results */}
            {result && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Test Results:</h3>
                
                <div className="space-y-4">
                  {/* Environment Check */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Environment Configuration:</h4>
                    <div className="bg-white border border-gray-200 rounded p-3 text-sm">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(result.envCheck, null, 2)}</pre>
                    </div>
                  </div>

                  {/* Success/Error */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Status:</h4>
                    <div className={`p-3 rounded ${
                      result.success 
                        ? 'bg-green-50 border border-green-200 text-green-800' 
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                      {result.success ? "✅ Success" : "❌ Failed"}
                    </div>
                  </div>

                  {/* Message */}
                  {result.message && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Message:</h4>
                      <div className="bg-white border border-gray-200 rounded p-3">
                        {result.message}
                      </div>
                    </div>
                  )}

                  {/* Error Details */}
                  {result.error && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Error:</h4>
                      <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800">
                        {result.error}
                      </div>
                    </div>
                  )}

                  {/* Full Results */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Full Results:</h4>
                    <div className="bg-white border border-gray-200 rounded p-3 text-sm max-h-96 overflow-auto">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
