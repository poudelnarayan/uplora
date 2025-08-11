"use client";

import AppShell from "@/components/layout/AppShell";

export default function TermsPage() {
  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl mx-auto">
        <h1 className="heading-2 text-center">Terms of Service</h1>
        <div className="card p-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>By using YTUploader you agree to these terms.</p>
          <h3 className="font-semibold text-foreground">Accounts</h3>
          <p>You must provide accurate information. Email/password accounts require verification. You are responsible for activity under your account.</p>
          <h3 className="font-semibold text-foreground">Teams & Roles</h3>
          <p>Owners can invite members and control roles (Admin, Manager, Editor). Owners may remove or disable members at any time.</p>
          <h3 className="font-semibold text-foreground">Content</h3>
          <p>You are responsible for the videos you upload. Do not upload unlawful or infringing content. We may remove content that violates policies or law.</p>
          <h3 className="font-semibold text-foreground">Email & Notifications</h3>
          <p>We may send transactional emails (invitations, verification) and product notices based on your settings.</p>
          <h3 className="font-semibold text-foreground">Termination</h3>
          <p>You may delete your account at any time. Deleting an owner account removes owned teams and related data.</p>
          <h3 className="font-semibold text-foreground">Changes</h3>
          <p>We may update these terms. Continued use constitutes acceptance of changes.</p>
        </div>
      </div>
    </AppShell>
  );
}
