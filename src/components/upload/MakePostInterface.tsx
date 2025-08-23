"use client";

import { motion } from "framer-motion";
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Youtube,
  Sparkles,
  User,
  Users,
  Zap,
  Target,
  Shield
} from "lucide-react";
import { useRouter } from "next/navigation";

const MotionDiv = motion.div as any;

interface MakePostInterfaceProps {
  selectedTeam?: { name: string } | null;
  selectedTeamId: string | null;
}

export default function MakePostInterface({ selectedTeam, selectedTeamId }: MakePostInterfaceProps) {
  const router = useRouter();

  const contentTypes = [
    {
      id: "text",
      title: "Text Post",
      subtitle: "Share thoughts",
      icon: FileText,
      color: "rgb(0, 173, 181)",
      bgColor: "rgba(0, 173, 181, 0.1)",
      description: "Quick text updates and announcements",
      route: "/make-post/text"
    },
    {
      id: "image",
      title: "Image Post", 
      subtitle: "Visual content",
      icon: ImageIcon,
      color: "rgb(57, 62, 70)",
      bgColor: "rgba(57, 62, 70, 0.1)",
      description: "Photos and graphics for social media",
      route: "/make-post/image"
    },
    {
      id: "reel",
      title: "Short Reel",
      subtitle: "Quick videos",
      icon: Sparkles,
      color: "rgb(34, 40, 49)",
      bgColor: "rgba(34, 40, 49, 0.1)",
      description: "Short-form content for TikTok, Instagram",
      route: "/make-post/reel"
    },
    {
      id: "video",
      title: "Long Video",
      subtitle: "YouTube content",
      icon: Youtube,
      color: "rgb(0, 173, 181)",
      bgColor: "rgba(0, 173, 181, 0.1)",
      description: "Full-length videos for YouTube",
      route: "/make-post/video"
    }
  ];

  const handlePostTypeClick = (route: string) => {
    router.push(route);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <MotionDiv
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border-2"
          style={{ 
            backgroundColor: 'rgba(0, 173, 181, 0.1)',
            borderColor: 'rgb(0, 173, 181)',
            color: 'rgb(0, 173, 181)'
          }}
        >
          {selectedTeam ? (
            <>
              <Users className="w-5 h-5" />
              <span className="font-semibold">Team: {selectedTeam.name}</span>
            </>
          ) : (
            <>
              <User className="w-5 h-5" />
              <span className="font-semibold">Personal Workspace</span>
            </>
          )}
        </div>
        
        <h1 className="text-4xl font-bold" style={{ color: 'rgb(34, 40, 49)' }}>
          Create Amazing Content
        </h1>
        <p className="text-lg" style={{ color: 'rgb(57, 62, 70)' }}>
          Choose your content type and start creating
        </p>
      </MotionDiv>

      {/* Content Type Selector Grid */}
      <MotionDiv
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {contentTypes.map((type, index) => {
          const IconComponent = type.icon;
          
          return (
            <MotionDiv
              key={type.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePostTypeClick(type.route)}
              className="relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-2xl"
              style={{
                backgroundColor: 'rgb(238, 238, 238)',
                borderColor: type.color,
                color: type.color
              }}
            >
              {/* Animated Background Gradient */}
              <div 
                className="absolute inset-0 rounded-3xl opacity-0 hover:opacity-10 transition-opacity duration-300"
                style={{ backgroundColor: type.color }}
              />
              
              <div className="relative text-center space-y-4">
                {/* Icon with Pulse Animation */}
                <MotionDiv
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, type: "spring", bounce: 0.3, delay: 0.2 * index }}
                  className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center transition-all duration-300"
                  style={{ backgroundColor: type.color }}
                >
                  <IconComponent className="w-8 h-8 text-white" />
                </MotionDiv>
                
                {/* Content */}
                <div>
                  <h3 className="font-bold text-xl mb-2" style={{ color: 'rgb(34, 40, 49)' }}>
                    {type.title}
                  </h3>
                  <p className="text-sm font-medium mb-3" style={{ color: type.color }}>
                    {type.subtitle}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgb(57, 62, 70)' }}>
                    {type.description}
                  </p>
                </div>

                {/* Hover Arrow Indicator */}
                <MotionDiv
                  initial={{ opacity: 0, x: -10 }}
                  whileHover={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-4 right-4"
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: type.color }}
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </MotionDiv>
              </div>
            </MotionDiv>
          );
        })}
      </MotionDiv>

      {/* Features Section */}
      <MotionDiv
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {[
          { 
            icon: Zap, 
            title: "Lightning Fast", 
            desc: "Quick content creation",
            color: "rgb(0, 173, 181)"
          },
          { 
            icon: Shield, 
            title: "Secure", 
            desc: "Protected uploads",
            color: "rgb(57, 62, 70)"
          },
          { 
            icon: Target, 
            title: "Multi-Platform", 
            desc: "YouTube, TikTok & more",
            color: "rgb(34, 40, 49)"
          }
        ].map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <MotionDiv
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="text-center p-6 rounded-2xl border transition-all duration-300"
              style={{
                backgroundColor: 'rgba(238, 238, 238, 0.8)',
                borderColor: 'rgba(57, 62, 70, 0.2)'
              }}
            >
              <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center transition-all duration-300 hover:scale-110"
                style={{ backgroundColor: 'rgba(0, 173, 181, 0.1)' }}
              >
                <IconComponent className="w-6 h-6" style={{ color: feature.color }} />
              </div>
              <h3 className="font-bold mb-2" style={{ color: 'rgb(34, 40, 49)' }}>
                {feature.title}
              </h3>
              <p className="text-sm" style={{ color: 'rgb(57, 62, 70)' }}>
                {feature.desc}
              </p>
            </MotionDiv>
          );
        })}
      </MotionDiv>

      {/* Call to Action */}
      <MotionDiv
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="text-center p-8 rounded-2xl border-2"
        style={{
          backgroundColor: 'rgba(0, 173, 181, 0.05)',
          borderColor: 'rgba(0, 173, 181, 0.3)'
        }}
      >
        <h3 className="text-xl font-bold mb-2" style={{ color: 'rgb(34, 40, 49)' }}>
          Ready to Create?
        </h3>
        <p className="text-sm" style={{ color: 'rgb(57, 62, 70)' }}>
          Choose a content type above to start creating amazing posts for your audience
        </p>
      </MotionDiv>
    </div>
  );
}