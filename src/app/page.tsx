"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton 
} from '@clerk/nextjs';

const MotionDiv = motion.div as any;
const MotionHeader = motion.header as any;
import { 
  Video, 
  Users, 
  Shield, 
  ArrowRight, 
  Upload, 
  CheckCircle, 
  Clock, 
  Play, 
  Star, 
  Youtube, 
  Zap, 
  Target, 
  Eye,
  Workflow,
  Sparkles,
  Globe,
  TrendingUp,
  Award,
  Coffee
} from "lucide-react";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <NextSeoNoSSR
        title="Streamline Your YouTube Team Workflow"
        description="The modern way to collaborate on YouTube content. Upload, review, approve, and publish with your team."
        canonical={typeof window !== "undefined" ? window.location.origin + "/" : undefined}
        openGraph={{
          url: typeof window !== "undefined" ? window.location.href : undefined,
          title: "Streamline Your YouTube Team Workflow",
          description: "The modern way to collaborate on YouTube content. Upload, review, approve, and publish with your team.",
        }}
      />
      
      {/* Header */}
      <MotionHeader
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-background/80 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold font-display text-foreground">Uplora</span>
            </div>
            
            {/* Clerk Authentication Buttons */}
            <div className="flex items-center gap-4">
              <SignedOut>
                <a href="/sign-in" className="btn btn-ghost text-sm">Sign In</a>
                <a href="/sign-up" className="btn btn-primary text-sm">Sign Up</a>
              </SignedOut>
              <SignedIn>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                      userButtonPopoverCard: "bg-card border border-border shadow-lg",
                      userButtonPopoverActionButton: "text-foreground hover:bg-muted",
                      userButtonPopoverActionButtonText: "text-foreground"
                    }
                  }}
                  afterSignOutUrl="/"
                />
              </SignedIn>
            </div>
          </div>
        </div>
      </MotionHeader>

      {/* Hero Section */}
      <section className="hero-section relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <MotionDiv
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
                <Sparkles className="w-4 h-4" />
                Trusted by 500+ YouTube teams
              </div>
              
              <h1 className="heading-1 mb-6 max-w-4xl mx-auto">
                The modern way to manage
                <br />
                <span style={{ 
                  background: 'linear-gradient(135deg, rgb(0, 173, 181), rgb(0, 173, 181))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontFamily: 'Inter, Open Sans, sans-serif'
                }}>YouTube team content</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Inter, Open Sans, sans-serif' }}>
                Stop the chaos of file sharing and manual uploads. Streamline your team's YouTube workflow with smart approvals and direct publishing.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <SignedOut>
                  <a href="/sign-up" className="btn btn-primary btn-lg" style={{ fontFamily: 'Inter, Open Sans, sans-serif' }}>
                    Start your free trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </a>
                </SignedOut>
                <SignedIn>
                  <button 
                    onClick={() => router.push("/dashboard")}
                    className="btn btn-primary btn-lg"
                    style={{ fontFamily: 'Inter, Open Sans, sans-serif' }}
                  >
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </SignedIn>
                <button 
                  onClick={() => router.push("/about")}
                  className="btn btn-secondary btn-lg"
                  style={{ fontFamily: 'Inter, Open Sans, sans-serif' }}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch demo
                </button>
              </div>

              <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground" style={{ fontFamily: 'Inter, Open Sans, sans-serif' }}>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-success" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-success" />
                  <span>Unlimited team members</span>
                </div>
              </div>
            </MotionDiv>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <MotionDiv
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="absolute top-20 left-20 w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 animate-float"
          >
            <Youtube className="w-8 h-8 text-red-500" />
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="absolute top-32 right-32 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 animate-float"
            style={{ animationDelay: '1s' }}
          >
            <Upload className="w-6 h-6 text-primary" />
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="absolute bottom-40 left-16 w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center border border-secondary/20 animate-float"
            style={{ animationDelay: '2s' }}
          >
            <Users className="w-7 h-7 text-secondary" />
          </MotionDiv>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="stats-card"
            >
              <div className="text-3xl font-bold text-foreground mb-2">15,000+</div>
              <div className="text-muted-foreground">Videos Published</div>
            </MotionDiv>
            
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="stats-card"
            >
              <div className="text-3xl font-bold text-foreground mb-2">500+</div>
              <div className="text-muted-foreground">Active Teams</div>
            </MotionDiv>
            
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="stats-card"
            >
              <div className="text-3xl font-bold text-foreground mb-2">98%</div>
              <div className="text-muted-foreground">Time Saved</div>
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="stats-card"
            >
              <div className="text-3xl font-bold text-foreground mb-2">24/7</div>
              <div className="text-muted-foreground">Support</div>
            </MotionDiv>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionDiv
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="heading-2 mb-4">Everything your team needs</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From upload to publish, we've got every step of your YouTube workflow covered.
            </p>
          </MotionDiv>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <MotionDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="feature-card"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Workflow className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Smart Workflow</h3>
              <p className="text-muted-foreground">
                Editors upload, managers review, owners approve. Everyone knows their role in the content pipeline.
              </p>
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="feature-card"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Direct uploads to YouTube. No more downloading from Drive and re-uploading manually.
              </p>
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="feature-card"
            >
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Secure & Reliable</h3>
              <p className="text-muted-foreground">
                Enterprise-grade security with role-based permissions and audit trails for every action.
              </p>
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="feature-card"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Global Teams</h3>
              <p className="text-muted-foreground">
                Work with team members anywhere in the world. Real-time collaboration that just works.
              </p>
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="feature-card"
            >
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Analytics & Insights</h3>
              <p className="text-muted-foreground">
                Track your team's performance with detailed analytics and actionable insights.
              </p>
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="feature-card"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Quality Control</h3>
              <p className="text-muted-foreground">
                Built-in review process ensures every video meets your standards before going live.
              </p>
            </MotionDiv>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionDiv
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="heading-2 mb-4">How it works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A simple 3-step process that transforms how your team creates content.
            </p>
          </MotionDiv>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MotionDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-bold mb-4">1</div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Upload & Create</h3>
              <p className="text-muted-foreground">
                Team members upload videos directly to your secure workspace. Add metadata, thumbnails, and descriptions.
              </p>
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-6">
                <Eye className="w-8 h-8 text-secondary" />
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-white text-sm font-bold mb-4">2</div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Review & Approve</h3>
              <p className="text-muted-foreground">
                Team leads review content, provide feedback, and approve videos for publishing with one click.
              </p>
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                <Youtube className="w-8 h-8 text-red-500" />
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent text-white text-sm font-bold mb-4">3</div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white text-sm font-bold mb-4">3</div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Publish & Track</h3>
              <p className="text-muted-foreground">
                Approved videos go straight to YouTube. Track performance and manage your content library.
              </p>
            </MotionDiv>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <MotionDiv
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="heading-2 mb-4">Loved by content teams worldwide</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of creators who've streamlined their YouTube workflow
            </p>
          </MotionDiv>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <MotionDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card p-6"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "Uplora transformed our content workflow. What used to take hours now takes minutes. Our team can focus on creating instead of managing files."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-sm font-bold text-white">S</span>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Sarah Chen</div>
                  <div className="text-sm text-muted-foreground">Content Director, TechFlow</div>
                </div>
              </div>
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "The approval system is genius. No more back-and-forth emails or missed uploads. Everything happens in one place."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                  <span className="text-sm font-bold text-white">M</span>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Marcus Rodriguez</div>
                  <div className="text-sm text-muted-foreground">YouTube Manager, CreativeHub</div>
                </div>
              </div>
            </MotionDiv>

            <MotionDiv
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="card p-6"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "Finally, a tool that understands YouTube teams. The role-based permissions are exactly what we needed."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                  <span className="text-sm font-bold text-white">A</span>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Alex Thompson</div>
                  <div className="text-sm text-muted-foreground">Founder, VideoFirst</div>
                </div>
              </div>
            </MotionDiv>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <MotionDiv
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="heading-2 mb-4">Ready to streamline your YouTube workflow?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of content creators who've already transformed their team collaboration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignedOut>
                <a href="/sign-up" className="btn btn-primary btn-lg">
                  Start your free trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              </SignedOut>
              <SignedIn>
                <button 
                  onClick={() => router.push("/dashboard")}
                  className="btn btn-primary btn-lg"
                >
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </SignedIn>
              <button 
                onClick={() => router.push("/contact")}
                className="btn btn-secondary btn-lg"
              >
                <Coffee className="w-5 h-5 mr-2" />
                Talk to our team
              </button>
            </div>
          </MotionDiv>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-section py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/about" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Press</a></li>
                <li><a href="/contact" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Guides</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="/terms" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="/copyright" className="hover:text-foreground transition-colors">Copyright</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center gap-3 mb-4 md:mb-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold font-display text-foreground">Uplora</span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Uplora. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}