"use client";

import PublicLayout from "@/components/layout/PublicLayout";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <PublicLayout title="Privacy Policy">
      <NextSeoNoSSR 
        title="Privacy Policy" 
        description="How Uplora protects your data and handles YouTube workflows."
        canonical={typeof window !== "undefined" ? window.location.origin + "/privacy" : undefined}
      />
      
      <div className="space-y-8">
        <div className="card p-8 space-y-6">
          <div className="space-y-4 text-foreground">
            <p className="text-lg leading-relaxed">
              This policy describes how Uplora handles your data. Uplora enables teams to streamline YouTube publishing by allowing editors to upload content that owners can approve and publish directly to YouTube.
            </p>

            <div className="space-y-6">
              <section>
                <h3 className="text-xl font-semibold mb-3 text-foreground">What Uplora Is</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Uplora is workflow software designed for YouTube content teams. We facilitate collaboration between team members but do not control, moderate, or modify your content. All publishing decisions remain between your team and YouTube's platform.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Information We Collect</h3>
                <div className="bg-muted/30 rounded-lg p-4">
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong className="text-foreground">Account Information:</strong> Name, email address, profile image</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong className="text-foreground">Team Data:</strong> Teams you create or join, member roles, invitations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong className="text-foreground">Upload Metadata:</strong> Filenames, file sizes, content types, descriptions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong className="text-foreground">Operational Logs:</strong> Basic request logs for security and troubleshooting</span>
                    </li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-foreground">How We Use Your Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Core Operations</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Authenticate users and manage permissions</li>
                      <li>• Enable uploads, approvals, and YouTube publishing</li>
                      <li>• Facilitate team collaboration</li>
                    </ul>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Communications</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Send verification emails</li>
                      <li>• Deliver team invitations</li>
                      <li>• Provide service updates</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Your Content and YouTube</h3>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
                  <p className="text-muted-foreground leading-relaxed">
                    When a team owner approves a video, Uplora uses your authorized YouTube integration to upload the file directly to your channel. <strong className="text-foreground">Uplora does not claim ownership of your content</strong>, does not edit videos, and does not remove content from YouTube. Any content policies, strikes, or removals are governed by YouTube's terms and your channel settings.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Data Sharing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We do not sell your personal data. Within teams, members can see information necessary for collaboration (uploads, approval status, team roles). We use trusted third-party providers for email delivery and cloud storage strictly to operate our service.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Security Measures</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-card border rounded-lg">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <span className="text-primary font-bold">🔒</span>
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">Encryption</h4>
                    <p className="text-sm text-muted-foreground">All data encrypted in transit and at rest</p>
                  </div>
                  <div className="text-center p-4 bg-card border rounded-lg">
                    <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <span className="text-secondary font-bold">🛡️</span>
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">Access Control</h4>
                    <p className="text-sm text-muted-foreground">Role-based permissions and secure authentication</p>
                  </div>
                  <div className="text-center p-4 bg-card border rounded-lg">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <span className="text-accent font-bold">📊</span>
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">Monitoring</h4>
                    <p className="text-sm text-muted-foreground">24/7 security monitoring and audit logs</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Your Rights and Choices</h3>
                <div className="bg-muted/30 rounded-lg p-6">
                  <div className="grid md:grid-cols-2 gap-4 text-muted-foreground">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Account Control</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Update your profile information</li>
                        <li>• Manage team memberships</li>
                        <li>• Delete your account anytime</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">YouTube Integration</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Disconnect YouTube access anytime</li>
                        <li>• Manage permissions in Google settings</li>
                        <li>• Control what data is shared</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Contact Us</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Have questions about this privacy policy or how we handle your data? 
                  <Link href="/contact" className="text-primary hover:underline ml-1">
                    Contact our team
                  </Link> and we'll be happy to help.
                </p>
              </section>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
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