"use client";

import { useState } from "react";

export default function TestFeedbackPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const testEmail = async (type: "feedback" | "idea") => {
    setLoading(true);
    setResult("");
    
    try {
      const response = await fetch("/api/test-feedback-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ ${data.message}`);
      } else {
        setResult(`❌ ${data.error || "Failed to send test email"}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Feedback Emails</h1>
        
        <div className="space-y-4">
          <button
            onClick={() => testEmail("feedback")}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Feedback Email"}
          </button>
          
          <button
            onClick={() => testEmail("idea")}
            disabled={loading}
            className="w-full bg-amber-500 text-white py-2 px-4 rounded-lg hover:bg-amber-600 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Idea Email"}
          </button>
        </div>
        
        {result && (
          <div className="mt-4 p-3 rounded-lg bg-gray-100">
            <p className="text-sm">{result}</p>
          </div>
        )}
        
        <div className="mt-6 text-xs text-gray-500">
          <p>Check your Fastmail aliases:</p>
          <p>• feedback@uplora.io</p>
          <p>• brainstorm@uplora.io</p>
        </div>
      </div>
    </div>
  );
}
