"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useAnimation } from "framer-motion";
import { Video, Users, Shield, ArrowRight, Upload, CheckCircle, Clock, Play, Star, Youtube, Zap, Target, Eye } from "lucide-react";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (session) {
      router.push("/dashboard");
    }
  }
  )
}
export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
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
        className="relative z-10 bg-white border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Uplora</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <button className="text-gray-600 hover:text-gray-900 font-medium">Features</button>
              <button className="text-gray-600 hover:text-gray-900 font-medium">Teams</button>
              <button className="text-gray-600 hover:text-gray-900 font-medium">Resources</button>
              <button className="text-gray-600 hover:text-gray-900 font-medium">Pricing</button>
            </nav>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push("/signin")}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Log in
              </button>
              <button 
                onClick={() => router.push("/signin")}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full font-medium transition-colors"
              >
                Get started now
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section with Floating Icons */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 to-white">
        {/* Floating Social Media Icons */}
        <div className="absolute inset-0 pointer-events-none">
          {/* YouTube Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="absolute top-20 left-20 w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center"
          >
            <Youtube className="w-8 h-8 text-red-600" />
          </motion.div>

          {/* Upload Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="absolute top-32 right-32 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"
          >
            <Upload className="w-6 h-6 text-blue-600" />
          </motion.div>

          {/* Users Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="absolute bottom-40 left-16 w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center"
          >
            <Users className="w-7 h-7 text-purple-600" />
          </motion.div>

          {/* Video Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="absolute bottom-20 right-20 w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center"
          >
            <Video className="w-6 h-6 text-green-600" />
          </motion.div>

          {/* Additional floating icons */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3, duration: 0.8 }}
            className="absolute top-1/2 left-8 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"
          >
            <Zap className="w-5 h-5 text-orange-600" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="absolute top-1/3 right-8 w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center"
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
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Your YouTube team
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                workspace
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
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
                className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-900"
              />
              <button 
                onClick={() => router.push("/signin")}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Get started now <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
            
            <p className="text-sm text-gray-500">
              By entering your email, you agree to receive emails from Uplora.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gray-50 rounded-2xl p-8"
            >
              <div className="text-4xl font-bold text-gray-900 mb-2">5,000+</div>
              <div className="text-gray-600">Videos Uploaded</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gray-50 rounded-2xl p-8"
            >
              <div className="text-4xl font-bold text-gray-900 mb-2">2.5M+</div>
              <div className="text-gray-600">Hours Saved</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gray-50 rounded-2xl p-8"
            >
              <div className="text-4xl font-bold text-gray-900 mb-2">500+</div>
              <div className="text-gray-600">Active Teams</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Publish Section - Purple */}
      <section className="py-20 bg-gradient-to-br from-purple-100 to-purple-200 relative overflow-hidden">
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
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                The most complete set of
                <br />
                publishing integrations, ever
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Schedule your content to YouTube with seamless team approvals. 
                From upload to publish, everything happens in one workspace.
              </p>
              <button className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center gap-2">
                Learn more <ArrowRight className="w-4 h-4" />
              </button>
              
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Auto-publish your content or get a notification when it's time to post</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Zap className="w-5 h-5 text-blue-500" />
                  <span>Magically customize and repurpose your post for each platform</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
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
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <Youtube className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Video className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Nothing beats the taste of fresh, homemade content 🍝
                    #TeamUpload
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="aspect-square bg-gradient-to-br from-orange-200 to-orange-300 rounded-lg"></div>
                    <div className="aspect-square bg-gradient-to-br from-blue-200 to-blue-300 rounded-lg"></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <select className="text-sm border border-gray-200 rounded-lg px-3 py-2">
                      <option>Save as Draft</option>
                    </select>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Thursday 29 11:45 AM
                    </div>
                  </div>
                  
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors">
                    Schedule Post
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Create Section - Coral */}
      <section className="py-20 bg-gradient-to-br from-red-100 to-orange-200 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative order-2 lg:order-1"
            >
              {/* Mock Team Dashboard */}
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-auto">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-xs text-white font-bold">A</span>
                    </div>
                    <span className="text-sm font-medium">AI Assistant</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                    Provide a list of content ideas about team collaboration
                  </div>
                  <button className="w-full mt-2 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">
                    Generate ideas
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg"></div>
                  <div className="aspect-square bg-gradient-to-br from-purple-200 to-purple-300 rounded-lg"></div>
                  <div className="aspect-square bg-gradient-to-br from-green-200 to-green-300 rounded-lg"></div>
                  <div className="aspect-square bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-lg"></div>
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
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Turn any idea into the perfect
                <br />
                video
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Whether you're flying solo or working with a team, Uplora has all the 
                features to help you create, organize, and repurpose your content for 
                YouTube. There's also an AI Assistant if you need it.
              </p>
              <button className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-full font-medium transition-colors flex items-center gap-2">
                Learn more <ArrowRight className="w-4 h-4" />
              </button>
              
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <Upload className="w-5 h-5 text-blue-500" />
                  <span>Import content from Canva, Dropbox, Google and more</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span>Visually organize your ideas into groups or themes</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span>Add a beautiful link in bio page to your profiles</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">
              RESOURCES
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Fuel your YouTube success
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to level up your video strategy—in one place.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Tools Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-green-100 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Free Upload Tools</h3>
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-gray-700 mb-6">
                A collection of free tools to make your YouTube 
                uploads easier and more effective
              </p>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Generate your next video upload with one click</div>
                <div className="bg-blue-600 text-white text-center py-2 rounded-lg text-sm font-medium">
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
              className="bg-purple-100 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Team Workflow Guide</h3>
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-gray-700">
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
              className="bg-blue-100 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Best Time to Upload</h3>
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-gray-700">
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
              className="bg-yellow-100 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">YouTube Resources</h3>
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-gray-700">
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
            className="mt-6 bg-red-100 rounded-2xl p-8 hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">YouTube Team Management 101</h3>
              <ArrowRight className="w-6 h-6 text-gray-600 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-lg text-gray-700">
              Your go-to guide for mastering the basics of 
              team collaboration and beyond
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            <div>
              <h4 className="font-semibold mb-4 text-green-400">Tools</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Create</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Publish</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Engage</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Analyze</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Collaborate</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-green-400">Features</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">AI Assistant</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Start Page</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Team Workspace</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-green-400">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="/about" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Template Library</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Resource Library</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Free Tools</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-green-400">Transparency</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Open Hub</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Transparent Metrics</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Transparent Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Product Roadmap</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-green-400">Support</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="/contact" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Request a Feature</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-green-400">Company</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="/about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Legal</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Sitemap</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center gap-3 mb-4 md:mb-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-green-400">Uplora</span>
              </div>
              
              <div className="flex items-center gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Video className="w-5 h-5" />
                </a>
              </div>
              
              <div className="text-sm text-gray-400">
                Copyright ©2025 Uplora | <a href="/privacy" className="hover:text-white transition-colors">Privacy</a> | <a href="/terms" className=\"hover:text-white transition-colors">Terms</a> | Security
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}