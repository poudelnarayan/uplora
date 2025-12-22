"use client";

import { Card, CardContent } from "@/app/components/ui/card";
import { Edit, Eye, CheckCircle, Send, Play, Instagram, Linkedin, Twitter, Facebook, Music, ArrowRight, ArrowLeft, ArrowDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const workflowSteps = [
  {
    icon: Edit,
    title: "Draft",
    description: "Editors create and upload content",
    status: "Editor creates posts, uploads videos, adds captions",
    color: "bg-primary text-primary-foreground",
    textColor: "text-primary"
  },
  {
    icon: Eye,
    title: "Review",
    description: "Content awaits admin approval",
    status: "Admin reviews drafts for quality and brand compliance",
    color: "bg-warning text-warning-foreground",
    textColor: "text-warning"
  },
  {
    icon: CheckCircle,
    title: "Approve",
    description: "Admin approves for publishing",
    status: "Content gets approved with scheduled publish time",
    color: "bg-success text-success-foreground",
    textColor: "text-success"
  },
  {
    icon: Send,
    title: "Publish",
    description: "Automatic multi-platform publishing",
    status: "Content goes live across all selected platforms",
    color: "bg-accent text-accent-foreground",
    textColor: "text-accent"
  }
];

const WorkflowSection = () => {
  const { isVisible, elementRef } = useScrollAnimation();
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);

  // Auto-advance through workflow steps
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % workflowSteps.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const platforms = [
    { name: "YouTube", icon: Play, color: "bg-destructive", textColor: "text-destructive" },
    { name: "TikTok", icon: Music, color: "bg-accent", textColor: "text-accent" },
    { name: "Instagram", icon: Instagram, color: "bg-accent", textColor: "text-accent" },
    { name: "LinkedIn", icon: Linkedin, color: "bg-primary", textColor: "text-primary" },
    { name: "X", icon: Twitter, color: "bg-foreground", textColor: "text-foreground" },
    { name: "Facebook", icon: Facebook, color: "bg-primary", textColor: "text-primary" }
  ];
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/10"></div>
      
      <div ref={elementRef} className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Simple <span className="gradient-text">4-Step Workflow</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From draft to publish, every step is streamlined for maximum team efficiency
          </p>
        </div>

        {/* Desktop Flow */}
        <div className="hidden lg:block">
          <div className="relative">
            {/* Animated Connection Lines */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center space-x-8 w-full max-w-4xl">
                {workflowSteps.slice(0, -1).map((_, index) => (
                  <div key={index} className="flex-1 flex items-center">
                    <div className="flex-1"></div>
                    <div className="relative w-16 h-0.5 bg-border overflow-hidden">
                      {/* Animated progress line */}
                      <div 
                        className={`absolute left-0 top-0 h-full bg-primary transition-all duration-1000 ${
                          isVisible && activeStep > index ? 'w-full' : 'w-0'
                        }`}
                      />
                    </div>
                    <div className="flex-1"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className={`grid grid-cols-4 gap-8 relative z-10 transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              {workflowSteps.map((step, index) => (
                <Card 
                  key={index} 
                  className={`group hover-lift shadow-soft bg-card cursor-pointer transition-all duration-300 ${
                    activeStep === index 
                      ? 'ring-2 ring-primary/30 shadow-medium scale-[1.02]' 
                      : 'hover:shadow-lg hover:scale-[1.01]'
                  }`}
                  onClick={() => setActiveStep(index)}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <CardContent className={`p-6 text-center transition-all duration-300 ${
                    activeStep === index 
                      ? 'bg-gradient-to-br from-primary/5 to-accent/5' 
                      : 'hover:bg-gradient-to-br hover:from-secondary/20 hover:to-muted/10'
                  }`}>
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${step.color} mb-4 transition-all duration-300 ${
                      activeStep === index 
                        ? 'scale-105 shadow-md' 
                        : 'group-hover:scale-105 group-hover:shadow-md'
                    }`}>
                      <step.icon className="h-8 w-8" />
                    </div>
                    
                    <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                      activeStep === index ? 'text-primary' : step.textColor
                    }`}>
                      {step.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-3 font-medium">
                      {step.description}
                    </p>
                    
                    <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                      activeStep === index ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.status}
                    </p>

                    {/* Simple progress indicator */}
                    <div className={`mt-4 w-full bg-secondary/30 h-1 rounded-full overflow-hidden ${
                      activeStep === index ? 'opacity-100' : 'opacity-0'
                    } transition-all duration-500`}>
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-1000"
                        style={{ width: activeStep === index ? '100%' : '0%' }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Tablet Flow */}
        <div className="hidden md:block lg:hidden">
          <div className={`max-w-3xl mx-auto transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <div className="space-y-4">
              {/* Top Row: Draft -> Review */}
              <div className="flex items-center justify-center space-x-4">
                <Card 
                  className={`w-48 group hover-lift shadow-soft bg-card cursor-pointer transition-all duration-300 ${
                    activeStep === 0 ? 'ring-2 ring-primary/30 shadow-medium scale-[1.02]' : ''
                  }`}
                  onClick={() => setActiveStep(0)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${workflowSteps[0].color} text-white mb-3`}>
                      <Edit className="h-6 w-6" />
                    </div>
                    <h3 className={`text-lg font-semibold mb-1 ${activeStep === 0 ? 'text-primary' : workflowSteps[0].textColor}`}>
                      {workflowSteps[0].title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{workflowSteps[0].description}</p>
                  </CardContent>
                </Card>
                <ArrowRight className="text-primary h-6 w-6 flex-shrink-0" />
                <Card 
                  className={`w-48 group hover-lift shadow-soft bg-card cursor-pointer transition-all duration-300 ${
                    activeStep === 1 ? 'ring-2 ring-primary/30 shadow-medium scale-[1.02]' : ''
                  }`}
                  onClick={() => setActiveStep(1)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${workflowSteps[1].color} text-white mb-3`}>
                      <Eye className="h-6 w-6" />
                    </div>
                    <h3 className={`text-lg font-semibold mb-1 ${activeStep === 1 ? 'text-primary' : workflowSteps[1].textColor}`}>
                      {workflowSteps[1].title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{workflowSteps[1].description}</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Vertical Connecting Arrow from Review to Approve */}
              <div className="flex justify-center">
                <div className="ml-56">
                  <ArrowDown className="text-primary h-6 w-6" />
                </div>
              </div>
              
              {/* Bottom Row: Publish <- Approve */}
              <div className="flex items-center justify-center space-x-4">
                <Card 
                  className={`w-48 group hover-lift shadow-soft bg-card cursor-pointer transition-all duration-300 ${
                    activeStep === 3 ? 'ring-2 ring-primary/30 shadow-medium scale-[1.02]' : ''
                  }`}
                  onClick={() => setActiveStep(3)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${workflowSteps[3].color} text-white mb-3`}>
                      <Send className="h-6 w-6" />
                    </div>
                    <h3 className={`text-lg font-semibold mb-1 ${activeStep === 3 ? 'text-primary' : workflowSteps[3].textColor}`}>
                      {workflowSteps[3].title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{workflowSteps[3].description}</p>
                  </CardContent>
                </Card>
                <ArrowLeft className="text-primary h-6 w-6 flex-shrink-0" />
                <Card 
                  className={`w-48 group hover-lift shadow-soft bg-card cursor-pointer transition-all duration-300 ${
                    activeStep === 2 ? 'ring-2 ring-primary/30 shadow-medium scale-[1.02]' : ''
                  }`}
                  onClick={() => setActiveStep(2)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${workflowSteps[2].color} text-white mb-3`}>
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <h3 className={`text-lg font-semibold mb-1 ${activeStep === 2 ? 'text-primary' : workflowSteps[2].textColor}`}>
                      {workflowSteps[2].title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{workflowSteps[2].description}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Flow */}
        <div className={`md:hidden space-y-6 transition-all duration-1000 delay-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          {workflowSteps.map((step, index) => (
            <div key={index} className="relative">
              <Card className={`shadow-soft bg-card cursor-pointer transition-all duration-300 ${
                activeStep === index ? 'ring-2 ring-primary/50 shadow-lg scale-[1.02]' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full ${step.color} flex items-center justify-center text-white transition-transform duration-300 ${
                      activeStep === index ? 'scale-110' : ''
                    }`}>
                      <step.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold mb-1 transition-colors duration-300 ${
                        activeStep === index ? 'text-primary' : step.textColor
                      }`}>
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground mb-2 font-medium">
                        {step.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {step.status}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {index < workflowSteps.length - 1 && (
                <div className="flex justify-center py-3">
                  <div className={`w-0.5 h-6 rounded-full transition-colors duration-500 ${
                    activeStep > index ? 'bg-primary' : 'bg-border'
                  }`}></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Interactive Platform Logos */}
        <div className={`mt-16 text-center transition-all duration-1000 delay-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <p className="text-muted-foreground mb-6">Publishes to all major platforms simultaneously</p>
          <div className="flex flex-wrap gap-8 justify-center items-center">
            {platforms.map((platform, index) => (
              <div 
                key={platform.name}
                className="flex items-center space-x-3 group cursor-pointer p-2"
                style={{ transitionDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredPlatform(platform.name)}
                onMouseLeave={() => setHoveredPlatform(null)}
              >
                <div className={`w-12 h-12 ${platform.color} rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-soft ${
                  hoveredPlatform === platform.name ? 'scale-110 shadow-lg' : ''
                }`}>
                  <platform.icon className="h-6 w-6" />
                </div>
                <span className={`font-medium text-lg transition-colors duration-300 ${
                  hoveredPlatform === platform.name ? 'text-primary' : platform.textColor
                }`}>
                  {platform.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;