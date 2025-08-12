"use client";

import AppShell from "@/components/layout/AppShell";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";

export default function PrivacyPage() {
  return (
    <AppShell>
      <NextSeoNoSSR title="Privacy Policy" description="How Uplora handles data and YouTube workflows." />
      <div className="space-y-6 max-w-3xl mx-auto">
        <h1 className="heading-2 text-center">Privacy Policy</h1>
        <div className="card p-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>This policy describes how Uplora handles your data. Uplora enables teams to streamline YouTube publishing by allowing editors to upload content that owners/admins can approve and publish directly to YouTube.</p>

          <h3 className="font-semibold text-foreground">What we are</h3>
          <p>Uplora is workflow software. We do not control, moderate, or modify your content. Publishing decisions remain between your team (owner/admin) and YouTube.</p>

          <h3 className="font-semibold text-foreground">Information we collect</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>Account data: name, email, profile image</li>
            <li>Team data: teams you create or join, roles, invitations</li>
            <li>Upload metadata: filenames, sizes, content type, and optional descriptions</li>
            <li>Operational logs: basic request logs for troubleshooting and security</li>
          </ul>
          <h3 className="font-semibold text-foreground">How we use information</h3>
          <ul className="list-disc ml-6 space-y-1">
            <li>Authenticate users and manage team permissions</li>
            <li>Enable uploads and approvals, and initiate publishing to YouTube on your behalf when approved</li>
            <li>Send transactional emails (verification, invitations)</li>
            <li>Operate, secure, and improve the service</li>
          </ul>
          <h3 className="font-semibold text-foreground">Your content and YouTube</h3>
          <p>When an owner/admin approves a video, Uplora uses your authorized YouTube integration to upload the approved file directly to your channel. Uplora does not claim ownership, does not edit content, and does not remove videos from YouTube. Any removals, strikes, or policy actions are governed by YouTube and your channel settings.</p>

          <h3 className="font-semibold text-foreground">Sharing</h3>
          <p>We do not sell your data. Within a team, members can see the information necessary to collaborate (e.g., uploads, statuses). We use third‑party providers (e.g., email, cloud storage) strictly to operate the service.</p>

          <h3 className="font-semibold text-foreground">Security</h3>
          <p>We apply industry‑standard security measures. No method is 100% secure, but we strive to protect your data and access tokens.</p>

          <h3 className="font-semibold text-foreground">Your choices</h3>
          <p>You can update your profile, manage team membership, or delete your account. Disconnecting YouTube access can be done from within your Google account settings.</p>

          <h3 className="font-semibold text-foreground">Contact</h3>
          <p>Questions? Visit the Contact page to reach us.</p>
        </div>
      </div>
    </AppShell>
  );
}
