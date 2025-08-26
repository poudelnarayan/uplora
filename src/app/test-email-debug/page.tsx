"use client";

import { useState, useEffect } from "react";

export default function EmailDebugPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [envStatus, setEnvStatus] = useState<any>(null);

  const checkEnvironment = async () => {
    try {
      const res = await fetch("/api/test-email-debug");
      const data = await res.json();
      setEnvStatus(data);
    } catch (error) {
      console.error("Failed to check environment:", error);
    }
  };

  const sendTestEmail = async () => {
    if (!email) {
      alert("Please enter an email address");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/test-email-debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setResult({ success: res.ok, data });

      if (res.ok) {
        alert("✅ Test email sent! Check your inbox (and spam folder)");
      } else {
        alert(`❌ Email failed: ${data.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setResult({ success: false, error: errorMessage });
      alert(`❌ Network error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkEnvironment();
  }, []);

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ color: "#222831", marginBottom: "2rem" }}>📧 Email Debug Tool</h1>
      
      {/* Environment Status */}
      <div style={{ 
        backgroundColor: "#EEEEEE", 
        padding: "1rem", 
        borderRadius: "8px", 
        marginBottom: "2rem",
        border: "2px solid #393E46"
      }}>
        <h2 style={{ color: "#222831", marginBottom: "1rem" }}>Environment Configuration</h2>
        {envStatus ? (
          <div>
            <p><strong>Ready:</strong> {envStatus.ready ? "✅ Yes" : "❌ No"}</p>
            <div style={{ marginTop: "1rem" }}>
              {Object.entries(envStatus.environment).map(([key, value]) => (
                <div key={key} style={{ margin: "0.5rem 0" }}>
                  <strong>{key}:</strong> {String(value)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p>Loading environment status...</p>
        )}
        <button 
          onClick={checkEnvironment}
          style={{
            backgroundColor: "#00ADB5",
            color: "white",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginTop: "1rem"
          }}
        >
          Refresh Status
        </button>
      </div>

      {/* Test Email Form */}
      <div style={{ 
        backgroundColor: "#EEEEEE", 
        padding: "1rem", 
        borderRadius: "8px", 
        marginBottom: "2rem",
        border: "2px solid #393E46"
      }}>
        <h2 style={{ color: "#222831", marginBottom: "1rem" }}>Send Test Email</h2>
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "2px solid #393E46",
              borderRadius: "4px",
              fontSize: "1rem"
            }}
          />
        </div>
        <button
          onClick={sendTestEmail}
          disabled={loading}
          style={{
            backgroundColor: loading ? "#ccc" : "#00ADB5",
            color: "white",
            padding: "0.75rem 1.5rem",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "1rem"
          }}
        >
          {loading ? "Sending..." : "Send Test Email"}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div style={{ 
          backgroundColor: result.success ? "#d4edda" : "#f8d7da", 
          padding: "1rem", 
          borderRadius: "8px",
          border: `2px solid ${result.success ? "#c3e6cb" : "#f5c6cb"}`
        }}>
          <h2 style={{ color: "#222831", marginBottom: "1rem" }}>
            {result.success ? "✅ Success" : "❌ Error"}
          </h2>
          <pre style={{ 
            backgroundColor: "white", 
            padding: "1rem", 
            borderRadius: "4px", 
            overflow: "auto",
            fontSize: "0.875rem"
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: "2rem", padding: "1rem", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
        <h3 style={{ color: "#222831" }}>📋 Troubleshooting Tips:</h3>
        <ul style={{ color: "#393E46" }}>
          <li><strong>Check spam folder:</strong> Test emails often go to spam</li>
          <li><strong>SMTP credentials:</strong> Verify your email provider settings</li>
          <li><strong>Firewall:</strong> Ensure ports 465/587 are not blocked</li>
          <li><strong>Gmail users:</strong> Use App Passwords, not regular password</li>
          <li><strong>Corporate email:</strong> May have stricter spam filters</li>
        </ul>
      </div>
    </div>
  );
}
