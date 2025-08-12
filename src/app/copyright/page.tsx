"use client";

import AppShell from "@/components/layout/AppShell";

export default function CopyrightPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="heading-2">Copyright</h1>
        <div className="card p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Uplora. All rights reserved. The Uplora name, logo, and all related assets are trademarks of their respective owners.
          </p>
          <p className="text-sm text-muted-foreground">
            If you believe content uploaded by your team violates copyright, please remove it from your workspace. For takedown requests regarding this website, contact us through the Contact page with the URL, description of the material, and your contact details.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
