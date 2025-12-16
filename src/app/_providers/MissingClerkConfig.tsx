"use client";

import React from "react";

export function MissingClerkConfig() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ marginBottom: "1rem", color: "#ef4444" }}>Clerk Configuration Required</h1>
        <p style={{ marginBottom: "1rem", color: "#6b7280" }}>
          Please add your Clerk publishable key to continue.
        </p>
        <ol style={{ textAlign: "left", color: "#374151", lineHeight: "1.6" }}>
          <li>
            Go to{" "}
            <a
              href="https://dashboard.clerk.com/last-active?path=api-keys"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#3b82f6" }}
            >
              Clerk Dashboard
            </a>
          </li>
          <li>Copy your Publishable Key</li>
          <li>Add it to your .env.local file as NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</li>
          <li>Restart your development server</li>
        </ol>
      </div>
    </div>
  );
}


