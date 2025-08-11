"use client";

import AppShell from "@/components/layout/AppShell";

export default function PrivacyPage() {
  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl mx-auto">
        <h1 className="heading-2 text-center">Privacy Policy</h1>
        <div className="card p-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>This policy describes how YTUploader handles your data.</p>
          <h3 className="font-semibold text-foreground">Information we collect</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>Account data: name, email, profile image</li>
            <li>Team data: teams you create or join, roles, invitations</li>
            <li>Upload data: filenames, sizes, and metadata for videos stored in S3</li>
          </ul>
          <h3 className="font-semibold text-foreground">How we use information</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>Authenticate you and manage team permissions</li>
            <li>Send transactional emails (verification, invitations)</li>
            <li>Operate and improve the service</li>
          </ul>
          <h3 className="font-semibold text-foreground">Sharing</h3>
          <p>We do not sell your data. Team members can see team-related information shared within a workspace. We use third-party providers (e.g., email, cloud storage) to operate the service.</p>
          <h3 className="font-semibold text-foreground">Security</h3>
          <p>We use industry-standard measures to protect data. No method is 100% secure.</p>
          <h3 className="font-semibold text-foreground">Your choices</h3>
          <p>You may update your profile, manage notifications, leave teams, or delete your account at any time.</p>
          <h3 className="font-semibold text-foreground">Contact</h3>
          <p>Questions? Visit the Contact page to reach us.</p>
        </div>
      </div>
    </AppShell>
  );
}
