'use client';

import { Button } from "@/components/ui/button";
import { Play, ArrowRight } from "lucide-react";
import dashboardHero from "@/assets/dashboard-hero.jpg";
import InteractiveSocialIcons from "./InteractiveSocialIcons";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";

const HeroSection = () => {
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

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <SignedOut>
                <SignUpButton>
                  {/* Mobile-specific compact button */}
                  <div className="sm:hidden">
                    <Button 
                      size="sm" 
                      className="gradient-primary text-primary-foreground hover-glow text-sm px-4 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      Start Free
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Desktop button */}
                  <div className="hidden sm:block">
                    <Button 
                      size="lg" 
                      className="gradient-primary text-primary-foreground hover-glow text-lg px-8 py-4"
                    >
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  {/* Mobile-specific compact button */}
                  <div className="sm:hidden">
                    <Button 
                      size="sm" 
                      className="gradient-primary text-primary-foreground hover-glow text-sm px-4 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      Dashboard
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Desktop button */}
                  <div className="hidden sm:block">
                    <Button 
                      size="lg" 
                      className="gradient-primary text-primary-foreground hover-glow text-lg px-8 py-4"
                    >
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </Link>
              </SignedIn>
              
              {/* Mobile-specific compact secondary button */}
              <div className="sm:hidden">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-sm px-4 py-2 rounded-full font-medium border-2 hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
                >
                  <Play className="mr-1 h-3 w-3" />
                  Demo
                </Button>
              </div>
              
              {/* Desktop secondary button */}
              <div className="hidden sm:block">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-4 hover-lift"
                >
                  <Play className="mr-2 h-5 w-5" />
                  See How It Works
                </Button>
              </div>
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