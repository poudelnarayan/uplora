"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wifi, Users, Upload, CheckCircle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const MotivationSection = () => {
    const { isVisible, elementRef } = useScrollAnimation();

  return (
    <section className="py-20 bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="container mx-auto px-6">
        <div 
          ref={elementRef}
          className={`transition-all duration-1000 ${
            isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-primary font-medium mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              The Story Behind Uplora
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Born from a <span className="gradient-text">Real Problem</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Every great solution starts with a pain point. Here's the moment that sparked Uplora's creation.
            </p>
          </div>

          {/* Story Grid */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Problem Story */}
            <div className="space-y-8">
              <Card className="p-8 border-destructive/20 bg-destructive/5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center shrink-0">
                    <Wifi className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      The Remote Area Struggle
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      I watched my YouTuber friend struggle in remote locations with poor internet. 
                      Hours spent trying to upload a single video, missing deadlines, frustrated viewers. 
                      The traditional workflow was broken.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 border-destructive/20 bg-destructive/5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      Editor-Admin Collaboration Chaos
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Editors would finish videos but couldn't get admin approval in time. 
                      Admins traveled frequently, causing bottlenecks. Content sat waiting while 
                      opportunities slipped away.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Solution Visualization */}
            <div className="relative">
              <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">
                    The Uplora Solution
                  </h3>
                  
                  <div className="space-y-4 text-left">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-muted-foreground">
                        Editor uploads to Uplora from anywhere
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-muted-foreground">
                        Admin approves remotely with one click
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-muted-foreground">
                        Automatic upload to YouTube & all platforms
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-accent rounded-full opacity-60 animate-bounce"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-primary rounded-full opacity-40 animate-pulse"></div>
            </div>
          </div>

          {/* Impact Statement */}
          <Card className="p-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              What Started for YouTube, Now Powers Every Platform
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-4xl mx-auto">
              That initial solution for YouTube creators evolved into something bigger. 
              Today, Uplora enables seamless team collaboration across all social media platforms, 
              eliminating the barriers between creation and publication.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-medium hover:shadow-strong transition-all">
                Start Your Success Story
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <p className="text-sm text-muted-foreground">
                Join thousands who've solved their content workflow challenges
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default MotivationSection;