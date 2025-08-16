"use client";

import AppShell from "@/components/layout/AppShell";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <AppShell>
      <NextSeoNoSSR title="About" description="About Uplora — team video collaboration and approvals." />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <h1 className="heading-2">About Uplora</h1>
        <div className="card p-6 space-y-4">
          <p className="text-muted-foreground">
            Uplora is a collaborative workspace for YouTube teams. Editors upload to Uplora, owners/admins approve, and approved videos go straight to YouTube. No more downloading from Drive and re-uploading manually.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2 text-foreground">What it solves</h3>
              <ul className="list-disc ml-5 text-sm text-muted-foreground space-y-1">
                <li>Centralizes team uploads and approvals</li>
                <li>Invites via secure links and email</li>
                <li>Role-based access (active/disabled status)</li>
                <li>Simple, modern UI focused on team workflows</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2 text-foreground">Core features</h3>
              <ul className="list-disc ml-5 text-sm text-muted-foreground space-y-1">
                <li>Team workspaces with multiple teams per user</li>
                <li>Email invitations with verification and expiry</li>
                <li>S3 upload with progress and status</li>
                <li>Custom notifications and modals</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </AppShell>
  );
}
