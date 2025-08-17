"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Video, Users, Shield, ArrowRight, Upload, CheckCircle, Clock, Play, Star, Youtube, Zap, Target, Eye } from "lucide-react";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="landing-page min-h-screen">
      <NextSeoNoSSR
        title="Team YouTube Workflow"
        description="Upload to S3, manage approvals, and collaborate with your team."
        canonical={typeof window !== "undefined" ? window.location.origin + "/" : undefined}
        openGraph={{
          url: typeof window !== "undefined" ? window.location.href : undefined,
          title: "Team YouTube Workflow",
          description: "Upload to S3, manage approvals, and collaborate with your team.",
        }}
      />
      
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="landing-header relative z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Uplora</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <button className="text-muted-foreground hover:text-foreground font-medium transition-colors">Features</button>
              <button className="text-muted-foreground hover:text-foreground font-medium transition-colors">Teams</button>
              <button className="text-muted-foreground hover:text-foreground font-medium transition-colors">Resources</button>
              <button className="text-muted-foreground hover:text-foreground font-medium transition-colors">Pricing</button>
            </nav>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push("/signin")}
                className="text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Log in
              </button>
              <button 
                onClick={() => router.push("/signin")}
                className="btn btn-primary"
              >
                Get started now
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section with Floating Icons */}
      <section className="homepage-hero relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Floating Social Media Icons */}
        <div className="absolute inset-0 pointer-events-none">
          {/* YouTube Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="absolute top-20 left-20 w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20"
          >
            <Youtube className="w-8 h-8 text-red-600" />
          </motion.div>

          {/* Upload Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="absolute top-32 right-32 w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20"
          >
            <Upload className="w-6 h-6 text-blue-600" />
          </motion.div>

          {/* Users Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="absolute bottom-40 left-16 w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20"
          >
            <Users className="w-7 h-7 text-purple-600" />
          </motion.div>

          {/* Video Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="absolute bottom-20 right-20 w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20"
          >
            <Video className="w-6 h-6 text-green-600" />
          </motion.div>

          {/* Additional floating icons */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3, duration: 0.8 }}
            className="absolute top-1/2 left-8 w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center border border-orange-500/20"
          >
            <Zap className="w-5 h-5 text-orange-600" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="absolute top-1/3 right-8 w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center border border-pink-500/20"
          >
            <Target className="w-5 h-5 text-pink-600" />
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Your YouTube team
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                workspace
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Upload together without the chaos. Streamlined approvals for YouTube teams.
            </p>

            {/* Email Signup */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-4"
            >
              <input
                type="email"
                placeholder="Enter your email..."
                className="input flex-1 rounded-full"
              />
              <button 
                onClick={() => router.push("/signin")}
                className="btn btn-success rounded-full px-6 py-3 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Get started now <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
            
            <p className="text-sm text-muted-foreground">
              By entering your email, you agree to receive emails from Uplora.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="homepage-section py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card rounded-2xl p-8"
            >
              <div className="text-4xl font-bold text-foreground mb-2">5,000+</div>
              <div className="text-muted-foreground">Videos Uploaded</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="card rounded-2xl p-8"
            >
              <div className="text-4xl font-bold text-foreground mb-2">2.5M+</div>
              <div className="text-muted-foreground">Hours Saved</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="card rounded-2xl p-8"
            >
              <div className="text-4xl font-bold text-foreground mb-2">500+</div>
              <div className="text-muted-foreground">Active Teams</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Publish Section - Purple */}
      <section className="landing-section-accent py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="text-sm font-semibold text-purple-600 uppercase tracking-wider">
                PUBLISH
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                The most complete set of
                <br />
                publishing integrations, ever
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Schedule your content to YouTube with seamless team approvals. 
                From upload to publish, everything happens in one workspace.
              </p>
              <button className="btn btn-primary rounded-full px-6 py-3 flex items-center gap-2">
                Learn more <ArrowRight className="w-4 h-4" />
              </button>
              
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3 text-foreground">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Auto-publish your content or get a notification when it's time to post</span>
                </div>
                <div className="flex items-center gap-3 text-foreground">
                  <Zap className="w-5 h-5 text-blue-500" />
                  <span>Magically customize and repurpose your post for each platform</span>
                </div>
                <div className="flex items-center gap-3 text-foreground">
                  <Eye className="w-5 h-5 text-purple-500" />
                  <span>See everything you have scheduled in a calendar or queue view</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Mock Upload Interface */}
              <div className="card rounded-2xl shadow-2xl p-6 max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Youtube className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Video className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Nothing beats the taste of fresh, homemade content 🍝
                    #TeamUpload
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="aspect-square bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-lg border border-orange-500/20"></div>
                    <div className="aspect-square bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg border border-blue-500/20"></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <select className="input text-sm px-3 py-2">
                      <option>Save as Draft</option>
                    </select>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Thursday 29 11:45 AM
                    </div>
                  </div>
                  
                  <button className="btn btn-primary w-full py-3">
                    Schedule Post
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Create Section - Coral */}
      <section className="landing-section-light py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative order-2 lg:order-1"
            >
              {/* Mock Team Dashboard */}
              <div className="card rounded-2xl shadow-2xl p-6 max-w-md mx-auto">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-xs text-white font-bold">A</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">AI Assistant</span>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">
                    Provide a list of content ideas about team collaboration
                  </div>
                  <button className="btn btn-primary w-full mt-2 py-2 text-sm">
                    Generate ideas
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="aspect-square bg-gradient-to-br from-muted to-border rounded-lg"></div>
                  <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg"></div>
                  <div className="aspect-square bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg"></div>
                  <div className="aspect-square bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-lg"></div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6 order-1 lg:order-2"
            >
              <div className="text-sm font-semibold text-red-600 uppercase tracking-wider">
                CREATE
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                Turn any idea into the perfect
                <br />
                video
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Whether you're flying solo or working with a team, Uplora has all the 
                features to help you create, organize, and repurpose your content for 
                YouTube. There's also an AI Assistant if you need it.
              </p>
              <button className="btn btn-primary rounded-full px-6 py-3 flex items-center gap-2">
                Learn more <ArrowRight className="w-4 h-4" />
              </button>
              
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3 text-foreground">
                  <Upload className="w-5 h-5 text-blue-500" />
                  <span>Import content from Canva, Dropbox, Google and more</span>
                </div>
                <div className="flex items-center gap-3 text-foreground">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span>Visually organize your ideas into groups or themes</span>
                </div>
                <div className="flex items-center gap-3 text-foreground">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span>Add a beautiful link in bio page to your profiles</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="landing-section-light py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              RESOURCES
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Fuel your YouTube success
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to level up your video strategy—in one place.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Tools Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card bg-green-500/10 border-green-500/20 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">Free Upload Tools</h3>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-muted-foreground mb-6">
                A collection of free tools to make your YouTube 
                uploads easier and more effective
              </p>
              <div className="card rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-2">Generate your next video upload with one click</div>
                <div className="btn btn-primary w-full text-center py-2 text-sm">
                  Upload Now
                </div>
              </div>
            </motion.div>

            {/* Team Glossary Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="card bg-purple-500/10 border-purple-500/20 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">Team Workflow Guide</h3>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-muted-foreground">
                A glossary of the most popular terms to help 
                you make sense of all the team workflow lingo
              </p>
            </motion.div>

            {/* Best Time Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="card bg-blue-500/10 border-blue-500/20 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">Best Time to Upload</h3>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-muted-foreground">
                Discover the best times to upload 
                on YouTube to maximize your 
                engagement
              </p>
            </motion.div>

            {/* Resources Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="card bg-yellow-500/10 border-yellow-500/20 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-foreground">YouTube Resources</h3>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-muted-foreground">
                A collection of articles and interviews packed with tips, 
                stories, and insights to level up your YouTube game
              </p>
            </motion.div>
          </div>

          {/* Bottom Resource Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-6 card bg-red-500/10 border-red-500/20 rounded-2xl p-8 hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-foreground">YouTube Team Management 101</h3>
              <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-lg text-muted-foreground">
              Your go-to guide for mastering the basics of 
              team collaboration and beyond
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            <div>
              <h4 className="font-semibold mb-4 text-primary">Tools</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Create</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Publish</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Engage</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Analyze</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Collaborate</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-primary">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">AI Assistant</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Start Page</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Team Workspace</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-primary">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/about" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Template Library</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Resource Library</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Free Tools</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-primary">Transparency</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Open Hub</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Transparent Metrics</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Transparent Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Product Roadmap</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-primary">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/contact" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Changelog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Request a Feature</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-primary">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/about" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Press</a></li>
                <li><a href="/terms" className="hover:text-foreground transition-colors">Legal</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Sitemap</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center gap-3 mb-4 md:mb-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-primary">Uplora</span>
              </div>
              
              <div className="flex items-center gap-4">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Users className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Video className="w-5 h-5" />
                </a>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Copyright ©2025 Uplora | <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a> | <a href="/terms" className="hover:text-foreground transition-colors">Terms</a> | Security
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
