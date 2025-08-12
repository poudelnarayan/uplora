"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useAnimation } from "framer-motion";
import { Video, Users, Shield, ArrowRight, Upload, CheckCircle, Clock, Play, Star } from "lucide-react";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const controlsRow1 = useAnimation();
  const controlsRow2 = useAnimation();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  useEffect(() => {
    const startRow1 = () => {
      controlsRow1.start({
        x: ["0%", "-50%"],
        transition: { duration: 80, ease: "linear", repeat: Infinity },
      });
    };
    const startRow2 = () => {
      controlsRow2.start({
        x: ["-50%", "0%"],
        transition: { duration: 90, ease: "linear", repeat: Infinity },
      });
    };
    startRow1();
    startRow2();
  }, [controlsRow1, controlsRow2]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="spinner-lg mx-auto mb-4" />
          <p className="text-foreground">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (session) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <NextSeoNoSSR
        title="Collaborative YouTube Uploads"
        description="Upload to S3, manage approvals, and collaborate with your team."
        canonical={typeof window !== "undefined" ? window.location.origin + "/" : undefined}
        openGraph={{
          url: typeof window !== "undefined" ? window.location.href : undefined,
          title: "Collaborative YouTube Uploads",
          description: "Upload to S3, manage approvals, and collaborate with your team.",
        }}
      />
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient">Uplora</h1>
              <p className="text-sm text-muted-foreground">Team YouTube Workflow</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8 max-w-3xl"
          >
            <div className="space-y-6">
              <h2 className="text-5xl lg:text-6xl font-bold text-gradient leading-tight">
                Upload • Approve • Publish
                <br />
                <span className="text-foreground">directly to YouTube</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                 Editors upload to Uplora. Owners approve. Videos publish to YouTube—no manual downloads.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Team Collaboration</h3>
                  <p className="text-sm text-muted-foreground">
                    Invite team members with different roles and permissions
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Video className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Direct Upload</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload videos to S3 with a smooth approval workflow
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Secure</h3>
                  <p className="text-sm text-muted-foreground">
                    Role-based access control and secure sharing
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-4">
              <button className="btn btn-primary btn-lg" onClick={() => router.push("/signin")}
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              <a href="#learn-more" className="btn btn-ghost btn-lg">
                Learn More
              </a>
            </div>
          </motion.div>

          {/* Right - Animated Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="flex justify-center lg:justify-end"
          >
            <motion.div
              initial={{ y: 0 }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="card p-6 w-full max-w-md relative overflow-hidden"
            >
              {/* Subtle background glow */}
              <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />

              {/* Mock Upload Card */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Upload className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Upload.mp4</p>
                      <p className="text-xs text-muted-foreground">1.2 GB • 4K • 60fps</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">64%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-primary to-secondary rounded-full" />
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" /> Uploading… Optimizing for streaming
                </div>
              </div>

              {/* Team Approvals */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-foreground">Team approvals</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">workflow</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/15" />
                      <div>
                        <p className="text-sm text-foreground">Alex (Editor)</p>
                        <p className="text-xs text-muted-foreground">Scene cuts ready</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5" /> Approved
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/15" />
                      <div>
                        <p className="text-sm text-foreground">Maya (Manager)</p>
                        <p className="text-xs text-muted-foreground">Reviewing title & tags</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 text-[12.5px] sm:text-sm font-medium whitespace-nowrap leading-none antialiased">
                      <Clock className="w-4 h-4" /> Awaiting Publish
                    </span>
                  </div>
                </div>
              </div>

              {/* Publish CTA mock */}
              <div className="flex items-center justify-between border rounded-lg p-3 bg-card/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary/15 flex items-center justify-center">
                    <Play className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Ready to publish</p>
                    <p className="text-xs text-muted-foreground">Owner approval required</p>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm">Publish</button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="container mx-auto px-4 py-16"
      >
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-foreground mb-4">Trusted by teams like yours</h3>
          <p className="text-muted-foreground">Built for fast collaboration and smooth publishing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient mb-2">2+</div>
            <p className="text-muted-foreground">Active Teams</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient mb-2">10+</div>
            <p className="text-muted-foreground">Videos Uploaded</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient mb-2">99.9%</div>
            <p className="text-muted-foreground">Uptime</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient mb-2">5x</div>
            <p className="text-muted-foreground">Faster Upload Workflow</p>
          </div>
        </div>

        {/* Reviews Carousel (2 rows) */}
        <div className="mt-10 space-y-5">
          {/* Row 1 */}
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-6 will-change-transform"
              animate={controlsRow1}
              onMouseEnter={() => controlsRow1.stop()}
              onMouseLeave={() =>
                controlsRow1.start({ x: ["0%", "-50%"], transition: { duration: 80, ease: "linear", repeat: Infinity } })
              }
            >
              {[
                { name: "Alex • Creator", text: "Uploads and approvals in one place. We move faster." },
                { name: "Maya • Manager", text: "Clear roles and smooth feedback. Team loves it." },
                { name: "Jordan • Editor", text: "Zero chaos. I always know what's next to cut." },
                { name: "Rina • Owner", text: "No more link hunting. Approvals are simple." },
              ]
                .concat([
                  { name: "Alex • Creator", text: "Uploads and approvals in one place. We move faster." },
                  { name: "Maya • Manager", text: "Clear roles and smooth feedback. Team loves it." },
                  { name: "Jordan • Editor", text: "Zero chaos. I always know what's next to cut." },
                  { name: "Rina • Owner", text: "No more link hunting. Approvals are simple." },
                ])
                .map((r, i) => (
                  <motion.div
                    key={`r1-${i}`}
                    className="card p-6 md:p-8 min-w-[340px] max-w-md"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-1 mb-3 text-yellow-500">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} className="w-5 h-5 fill-current" />
                      ))}
                    </div>
                    <p className="text-base text-foreground mb-2">“{r.text}”</p>
                    <p className="text-xs text-muted-foreground">{r.name}</p>
                  </motion.div>
                ))}
            </motion.div>
          </div>

          {/* Row 2 */}
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-6 will-change-transform"
              animate={controlsRow2}
              onMouseEnter={() => controlsRow2.stop()}
              onMouseLeave={() =>
                controlsRow2.start({ x: ["-50%", "0%"], transition: { duration: 90, ease: "linear", repeat: Infinity } })
              }
            >
              {[
                { name: "Casey • Producer", text: "From upload to publish, it's just smoother now." },
                { name: "Dev • Strategist", text: "Finally a workflow that matches how teams work." },
                { name: "Sam • Editor", text: "Fast S3 uploads and clear approvals. Perfect." },
                { name: "Noor • Manager", text: "Everyone knows the status. No guessing." },
              ]
                .concat([
                  { name: "Casey • Producer", text: "From upload to publish, it's just smoother now." },
                  { name: "Dev • Strategist", text: "Finally a workflow that matches how teams work." },
                  { name: "Sam • Editor", text: "Fast S3 uploads and clear approvals. Perfect." },
                  { name: "Noor • Manager", text: "Everyone knows the status. No guessing." },
                ])
                .map((r, i) => (
                  <motion.div
                    key={`r2-${i}`}
                    className="card p-6 md:p-8 min-w-[340px] max-w-md"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center gap-1 mb-3 text-yellow-500">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} className="w-5 h-5 fill-current" />
                      ))}
                    </div>
                    <p className="text-base text-foreground mb-2">“{r.text}”</p>
                    <p className="text-xs text-muted-foreground">{r.name}</p>
                  </motion.div>
                ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Why this matters (shown on landing page for signed-out users) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 pb-12"
      >
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-2">Why this matters</h3>
          <p className="text-muted-foreground">
            Without YTUploader, video collaboration is a patchwork of emails, drive links, and manual handoffs.
            Editors wait for access, managers chase approvals, and owners guess what's ready. We bring everything
            into one place: secure uploads to S3, simple approvals, and clean handoffs. Less chaos, more publishing.
          </p>
        </div>
      </motion.div>

      {/* Learn More Section */}
      <motion.section
        id="learn-more"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        className="container mx-auto px-4 pb-24"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <h4 className="font-semibold text-foreground mb-2">How it works</h4>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
              <li>Invite your team: owner, admin, manager, or editor</li>
              <li>Upload videos securely to S3</li>
              <li>Track status: pending, processing, published</li>
              <li>Publish when approved</li>
            </ul>
          </div>
          <div className="card p-6">
            <h4 className="font-semibold text-foreground mb-2">Why teams love it</h4>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
              <li>One place for uploads and approvals</li>
              <li>Clear roles and permissions</li>
              <li>Fast feedback with notifications</li>
              <li>Simple, modern UI</li>
            </ul>
          </div>
          <div className="card p-6">
            <h4 className="font-semibold text-foreground mb-2">Who is it for</h4>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
              <li>Creators working with editors</li>
              <li>Agencies managing channels</li>
              <li>Teams needing controlled publishing</li>
              <li>Anyone scaling YouTube workflows</li>
            </ul>
          </div>
        </div>
      </motion.section>
    </div>
  );
}