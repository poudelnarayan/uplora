"use client";

import PublicLayout from "@/app/components/layout/PublicLayout";
import { NextSeoNoSSR } from "@/app/components/seo/NoSSRSeo";
import Link from "next/link";

export default function TermsPage() {
  return (
    <PublicLayout title="Terms of Service">
      <NextSeoNoSSR 
        title="Terms of Service" 
        description="Terms and conditions for using Uplora's YouTube team workflow platform."
        canonical={typeof window !== "undefined" ? window.location.origin + "/terms" : undefined}
      />
      
      <div className="space-y-8">
        <div className="card p-8 space-y-6">
          <div className="space-y-4 text-foreground">
            <p className="text-lg leading-relaxed">
              By using Uplora, you agree to these terms of service. Please read them carefully as they govern your use of our YouTube team workflow platform.
            </p>

            <div className="space-y-6">
              <section>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Account Responsibilities</h3>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>You must provide accurate and complete information when creating your account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Email verification is required for account security</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>You are responsible for all activity under your account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span>Keep your login credentials secure and confidential</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Team Management & Roles</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Team Owners</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Can invite and remove team members</li>
                      <li>• Control member roles and permissions</li>
                      <li>• Approve or reject video publications</li>
                      <li>• Manage team settings and billing</li>
                    </ul>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">Team Members</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Upload videos according to their role</li>
                      <li>• Follow team guidelines and workflows</li>
                      <li>• Respect content and collaboration policies</li>
                      <li>• May be removed or disabled by team owners</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Content and YouTube Integration</h3>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 space-y-4">
                  <div>
                    <h4 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">Your Content Rights</h4>
                    <p className="text-muted-foreground">
                      You retain full ownership of all videos and content you upload. Uplora acts only as a workflow facilitator and does not claim any rights to your intellectual property.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">Content Responsibility</h4>
                    <p className="text-muted-foreground">
                      You are solely responsible for ensuring your content complies with YouTube's community guidelines, copyright laws, and all applicable regulations. Do not upload unlawful, infringing, or harmful content.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">YouTube Publishing</h4>
                    <p className="text-muted-foreground">
                      When approved by team owners, videos are uploaded directly to your YouTube channel using your authorization. All YouTube policies, strikes, and content decisions are governed by YouTube's terms of service.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Service Usage</h3>
                <div className="space-y-4">
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Acceptable Use</h4>
                    <p className="text-sm text-muted-foreground">
                      Use Uplora only for legitimate YouTube content collaboration. Do not attempt to circumvent security measures, abuse the service, or interfere with other users' workflows.
                    </p>
                  </div>
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Service Availability</h4>
                    <p className="text-sm text-muted-foreground">
                      We strive for 99.9% uptime but cannot guarantee uninterrupted service. Scheduled maintenance will be announced in advance when possible.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Communications</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We may send you transactional emails (account verification, team invitations, approval notifications) and occasional product updates. You can manage your communication preferences in your account settings.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Account Termination</h3>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-muted-foreground">
                    You may delete your account at any time from your settings page. <strong className="text-foreground">Warning:</strong> Deleting a team owner account will permanently remove the team and all associated data, including member access and uploaded content.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Changes to Terms</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We may update these terms periodically to reflect service improvements or legal requirements. Continued use of Uplora after changes constitutes acceptance of the updated terms.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Contact Information</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Questions about these terms? 
                  <Link href="/contact" className="text-primary hover:underline ml-1">
                    Contact our support team
                  </Link> for clarification or assistance.
                </p>
              </section>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}