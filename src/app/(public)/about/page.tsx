"use client";

import PublicLayout from "@/components/layout/PublicLayout";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import { motion } from "framer-motion";
import { 
  Users, 
  Target, 
  Zap, 
  Shield, 
  Heart, 
  Lightbulb,
  Award,
  Globe,
  TrendingUp,
  Coffee
} from "lucide-react";

export default function AboutPage() {
  return (
    <PublicLayout title="About Uplora">
      <NextSeoNoSSR 
        title="About Uplora" 
        description="Learn about Uplora's mission to streamline YouTube team workflows and content collaboration."
        canonical={typeof window !== "undefined" ? window.location.origin + "/about" : undefined}
      />
      
      <div className="space-y-12">
        {/* Mission Statement */}
        <div className="card p-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Simplifying YouTube for Teams
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We believe content creation should be about creativity, not file management. 
              Uplora eliminates the chaos of team video workflows, letting creators focus 
              on what they do best—creating amazing content.
            </p>
          </motion.div>
        </div>

        {/* Problem & Solution */}
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-8"
          >
            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-4">The Problem We Solve</h3>
            <div className="space-y-3 text-muted-foreground">
              <p>• Teams waste hours downloading from Drive and re-uploading to YouTube</p>
              <p>• No clear approval process leads to publishing mistakes</p>
              <p>• File sharing chaos with multiple versions and confusion</p>
              <p>• Lack of role-based permissions creates security risks</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-8"
          >
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-6">
              <Lightbulb className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-4">Our Solution</h3>
            <div className="space-y-3 text-muted-foreground">
              <p>• Direct upload to YouTube—no manual downloading</p>
              <p>• Smart approval workflow with clear team roles</p>
              <p>• Centralized workspace for all team content</p>
              <p>• Secure, role-based access with audit trails</p>
            </div>
          </motion.div>
        </div>

        {/* Core Values */}
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">What Drives Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Efficiency First</h3>
              <p className="text-muted-foreground">
                Every feature is designed to save time and eliminate friction in your content workflow.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Team-Centric</h3>
              <p className="text-muted-foreground">
                Built specifically for teams who need clear roles, permissions, and collaboration tools.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Security Focused</h3>
              <p className="text-muted-foreground">
                Your content and data are protected with enterprise-grade security measures.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Company Stats */}
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Uplora by the Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">15,000+</div>
              <div className="text-sm text-muted-foreground">Videos Published</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Active Teams</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">98%</div>
              <div className="text-sm text-muted-foreground">Time Saved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>
        </div>

        {/* Team Story */}
        <div className="card p-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-foreground mb-6">Our Story</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Uplora was born from the frustration of managing YouTube content across distributed teams. 
                We watched creators spend more time on file management than actual creation.
              </p>
              <p>
                After experiencing the pain of downloading videos from shared drives, re-uploading to YouTube, 
                and coordinating approvals through endless email chains, we knew there had to be a better way.
              </p>
              <p className="text-foreground font-medium">
                Today, Uplora powers content workflows for teams around the world, from small creator groups 
                to large media organizations—all focused on making YouTube collaboration seamless.
              </p>
            </div>
          </div>
        </div>

        {/* Why Choose Uplora */}
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Why Teams Choose Uplora</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Built for YouTube</h4>
                  <p className="text-sm text-muted-foreground">
                    Designed specifically for YouTube workflows, not adapted from generic file sharing tools.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Global Teams</h4>
                  <p className="text-sm text-muted-foreground">
                    Works seamlessly across time zones with async approval workflows and notifications.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Scales With You</h4>
                  <p className="text-sm text-muted-foreground">
                    From solo creators to enterprise teams—our platform grows with your needs.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Creator-Focused</h4>
                  <p className="text-sm text-muted-foreground">
                    Every decision is made with creators in mind—simple, intuitive, and powerful.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Privacy First</h4>
                  <p className="text-sm text-muted-foreground">
                    Your content stays yours. We're a workflow tool, not a content platform.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Coffee className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Human Support</h4>
                  <p className="text-sm text-muted-foreground">
                    Real people, real help. Our support team understands YouTube and content creation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="card p-8 text-center bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Transform Your Workflow?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of content creators who've already streamlined their YouTube team collaboration with Uplora.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => window.location.href = "/signin"}
              className="btn btn-primary btn-lg"
            >
              Start Your Free Trial
            </button>
            <button 
              onClick={() => window.location.href = "/contact"}
              className="btn btn-secondary btn-lg"
            >
              Talk to Our Team
            </button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}