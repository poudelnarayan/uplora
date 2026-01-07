"use client";

import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Users, Upload, Shield, Headphones, ArrowRight } from "lucide-react";
import { useScrollAnimation, useCounter } from "@/hooks/useScrollAnimation";

const stats = [
  {
    icon: Users,
    value: 100,
    label: "Happy Teams",
    suffix: "+",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    icon: Upload,
    value: 5000,
    label: "Posts Uploaded", 
    suffix: "+",
    color: "text-success",
    bgColor: "bg-success/10"
  },
  {
    icon: Shield,
    value: 99,
    label: "Uptime",
    suffix: "%",
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
  {
    icon: Headphones,
    value: 24,
    label: "Support",
    suffix: "/7",
    color: "text-warning",
    bgColor: "bg-warning/10"
  }
];

const StatsSection = () => {
  const { isVisible, elementRef } = useScrollAnimation();

  return (
    <section className="py-20 bg-gradient-to-b from-background to-secondary/20 relative overflow-hidden">
      {/* Floating particles */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 bg-primary/20 rounded-full"
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${20 + Math.sin(i) * 30}%`,
              animation: `float ${4 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>

      <div ref={elementRef} className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Trusted by <span className="gradient-text">Many</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join the growing community of creators and teams who've transformed their content workflow
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const count = useCounter(stat.value, 2000, isVisible);
            
            return (
              <Card 
                key={index} 
                className={`group hover-lift shadow-soft bg-card/80 backdrop-blur-sm border-0 cursor-pointer transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <CardContent className="p-8 text-center relative overflow-hidden">
                  {/* Background glow */}
                  <div className={`absolute inset-0 ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg`} />
                  
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${stat.bgColor} mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative z-10`}>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                  
                  <div className="relative z-10">
                    <div className={`text-4xl font-bold mb-2 ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                      {count.toLocaleString()}{stat.suffix}
                    </div>
                    
                    <p className="text-muted-foreground font-medium group-hover:text-foreground transition-colors duration-300">
                      {stat.label}
                    </p>
                  </div>

                  {/* Pulse effect */}
                  <div className={`absolute inset-0 ${stat.bgColor} opacity-0 group-hover:opacity-20 animate-ping rounded-lg`} />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to action */}
        <div className={`text-center mt-16 transition-all duration-1000 delay-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <p className="text-lg text-muted-foreground mb-6">
            Ready to join them and transform your content workflow?
          </p>
          <Button 
            size="lg" 
            className="gradient-cta text-primary-foreground hover-glow text-lg px-8 py-4 group"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.1); }
        }
      `}</style>
    </section>
  );
};

export default StatsSection;