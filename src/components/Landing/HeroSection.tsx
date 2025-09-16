'use client';

import { Button } from "@/components/ui/button";
import { Play, ArrowRight, ChevronDown, X } from "lucide-react";
import dashboardHero from "@/assets/dashboard-hero.jpg";
import InteractiveSocialIcons from "./InteractiveSocialIcons";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";

const HeroSection = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 gradient-hero opacity-5"></div>
      
      <div className="container mx-auto px-4 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Interactive Social Media Icons - Show first on mobile */}
          <div className="relative flex justify-center lg:justify-end order-1 lg:order-2">
            <div className="w-full max-w-md mx-auto lg:max-w-none lg:mx-0">
              <InteractiveSocialIcons />
            </div>
          </div>

          {/* Content - Show second on mobile */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Differentiator Badge - Industry Standard */}
            <div className="mb-8">
              <div className="inline-block bg-secondary/50 border border-border rounded-lg px-4 py-2">
                <span className="text-muted-foreground font-medium text-sm tracking-wide">
                  Not another social media scheduling platform, <span className="font-bold text-primary">IT'S MORE</span>
                </span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-poppins mb-6 leading-tight tracking-tight text-center lg:text-left">
              <div className="font-bold gradient-text text-4xl md:text-5xl lg:text-6xl mb-1">
                Collaborative
              </div>
              <div className="font-medium text-2xl md:text-3xl lg:text-4xl text-foreground flex items-center justify-center lg:justify-start gap-4">
                <span>Scheduling</span>
                <span className="hidden lg:block w-16 h-0.5 bg-primary"></span>
              </div>
              <div className="font-extralight text-xl md:text-2xl lg:text-3xl text-muted-foreground mt-2 tracking-widest">
                FOR EVERY PLATFORM
              </div>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl">
              Uplora helps creators and teams draft, approve, and publish across 
              <span className="text-primary font-medium"> YouTube, TikTok, Instagram, LinkedIn, X, and Facebook</span>{" "}
              with seamless team workflow collaboration.
            </p>
            
            <div className="bg-secondary/50 border border-border rounded-lg p-4 mb-8 max-w-2xl">
              <p className="text-foreground font-medium text-lg">
                🎯 Built for teams who need approval workflows
              </p>
              <p className="text-muted-foreground mt-1">
                Editors create • Admins review • System publishes automatically
              </p>
            </div>

            {/* Mobile Breadcrumb Menu */}
            <div className="sm:hidden relative mb-8">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full text-primary font-medium text-sm hover:bg-primary/20 transition-all duration-200"
              >
                <span>Get Started</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showMobileMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Mobile Dropdown Menu */}
              {showMobileMenu && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-2">
                    <SignedOut>
                      <SignUpButton>
                        <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-primary/5 transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <ArrowRight className="h-4 w-4 text-primary" />
                            </div>
                            <div className="text-left">
                              <div className="font-semibold text-gray-900">Get Started Free</div>
                              <div className="text-xs text-gray-500">7-day free trial</div>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                        </button>
                      </SignUpButton>
                    </SignedOut>
                    <SignedIn>
                      <Link href="/dashboard">
                        <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-primary/5 transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <ArrowRight className="h-4 w-4 text-primary" />
                            </div>
                            <div className="text-left">
                              <div className="font-semibold text-gray-900">Go to Dashboard</div>
                              <div className="text-xs text-gray-500">Access your workspace</div>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
                        </button>
                      </Link>
                    </SignedIn>
                    
                    <button 
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                      onClick={() => {
                        document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                        setShowMobileMenu(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <Play className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">See How It Works</div>
                          <div className="text-xs text-gray-500">Watch demo</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Backdrop to close menu */}
              {showMobileMenu && (
                <div 
                  className="fixed inset-0 bg-black/20 z-40"
                  onClick={() => setShowMobileMenu(false)}
                />
              )}
            </div>

            {/* Desktop Buttons */}
            <div className="hidden sm:flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <SignedOut>
                <SignUpButton>
                  <Button 
                    size="lg" 
                    className="gradient-primary text-primary-foreground hover-glow text-lg px-8 py-4"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button 
                    size="lg" 
                    className="gradient-primary text-primary-foreground hover-glow text-lg px-8 py-4"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </SignedIn>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-4 hover-lift"
              >
                <Play className="mr-2 h-5 w-5" />
                See How It Works
              </Button>
            </div>

            {/* Platform Logos */}
            <div className="mt-12">
              <p className="text-sm text-muted-foreground mb-4">Publish to all major platforms</p>
              <div className="flex flex-wrap gap-6 justify-center lg:justify-start items-center opacity-60">
                <div className="text-red-500 font-bold">YouTube</div>
                <div className="text-pink-500 font-bold">TikTok</div>
                <div className="text-purple-500 font-bold">Instagram</div>
                <div className="text-blue-600 font-bold">LinkedIn</div>
                <div className="text-gray-800 font-bold">X</div>
                <div className="text-blue-500 font-bold">Facebook</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;