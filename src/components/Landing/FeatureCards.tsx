import { Card, CardContent } from "@/components/ui/card";
import { Globe, Users, Upload, Sparkles, ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useState } from "react";

const features = [
  {
    icon: Globe,
    title: "Multi-Platform Publishing",
    description: "Post once, publish everywhere. Reach your audience across YouTube, TikTok, Instagram, LinkedIn, X, and Facebook simultaneously.",
    color: "text-blue-500"
  },
  {
    icon: Users,
    title: "Team Workspace",
    description: "Seamless collaboration where editors draft content and admins review and approve before publishing. Perfect role-based workflow.",
    color: "text-purple-500"
  },
  {
    icon: Upload,
    title: "YouTube Long Video Support",
    description: "Upload and schedule large video files with ease. Built specifically to handle YouTube's long-form content requirements.",
    color: "text-red-500"
  },
  {
    icon: Sparkles,
    title: "AI Assistance",
    description: "Future-ready automation for titles, thumbnails, and tags. Let AI optimize your content for maximum engagement.",
    color: "text-teal-500"
  }
];

const FeatureCards = () => {
  const { isVisible, elementRef } = useScrollAnimation();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <section id="features" className="py-20 bg-gradient-to-b from-background to-secondary/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div ref={elementRef} className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Everything you need to
            <span className="gradient-text"> scale your content</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Streamline your social media workflow with powerful features designed for teams and creators
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`group hover-lift shadow-soft border-0 bg-card/50 backdrop-blur-sm cursor-pointer relative overflow-hidden transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Interactive background glow */}
              <div 
                className={`absolute inset-0 transition-opacity duration-300 ${
                  hoveredCard === index ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  background: `radial-gradient(circle at center, ${feature.color.replace('text-', 'var(--')}10 0%, transparent 70%)`
                }}
              />

              <CardContent className="p-8 text-center relative z-10">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary/50 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ${feature.color} relative overflow-hidden`}>
                  <feature.icon className="h-8 w-8 relative z-10" />
                  
                  {/* Icon background pulse */}
                  {hoveredCard === index && (
                    <div className="absolute inset-0 bg-current opacity-10 animate-ping" />
                  )}
                </div>
                
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;