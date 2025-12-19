"use client";

import React from "react";

export function MissingClerkConfig() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 text-center bg-background text-foreground">
      <div>
        <h1 className="mb-4 text-xl font-semibold text-destructive">Clerk Configuration Required</h1>
        <p className="mb-4 text-muted-foreground">
          Please add your Clerk publishable key to continue.
        </p>
        <ol className="text-left text-foreground/90 leading-relaxed space-y-1">
          <li>
            Go to{" "}
            <a
              href="https://dashboard.clerk.com/last-active?path=api-keys"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-4"
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


