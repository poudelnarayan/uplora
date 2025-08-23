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
  Shield,
  ArrowRight,
  TrendingUp
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
      description: "Quick updates & announcements",
      route: "/make-post/text",
      features: ["280 characters", "Instant sharing", "Quick engagement"]
    },
    {
      id: "image",
      title: "Image Post", 
      subtitle: "Visual content",
      icon: ImageIcon,
      color: "rgb(57, 62, 70)",
      bgColor: "rgba(57, 62, 70, 0.1)",
      description: "Photos & graphics",
      route: "/make-post/image",
      features: ["High quality", "Social ready", "Multi-platform"]
    },
    {
      id: "reel",
      title: "Short Reel",
      subtitle: "Quick videos",
      icon: Sparkles,
      color: "rgb(34, 40, 49)",
      bgColor: "rgba(34, 40, 49, 0.1)",
      description: "TikTok & Instagram content",
      route: "/make-post/reel",
      features: ["Viral potential", "Quick creation", "Trending format"]
    },
    {
      id: "video",
      title: "Long Video",
      subtitle: "YouTube content",
      icon: Youtube,
      color: "rgb(0, 173, 181)",
      bgColor: "rgba(0, 173, 181, 0.1)",
      description: "Professional YouTube videos",
      route: "/make-post/video",
      features: ["Full length", "Professional", "Analytics"]
    }
  ];

  const handlePostTypeClick = (route: string) => {
    router.push(route);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <MotionDiv
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="text-center space-y-4"
      >
        <MotionDiv
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="inline-flex items-center gap-3 px-6 py-3 rounded-full border-2"
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
        </MotionDiv>
        
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <h1 className="text-5xl font-bold mb-4" style={{ color: 'rgb(34, 40, 49)' }}>
            Create Amazing Content
          </h1>
          <p className="text-xl" style={{ color: 'rgb(57, 62, 70)' }}>
            Choose your content type and start creating
          </p>
        </MotionDiv>
      </MotionDiv>

      {/* Content Type Selector Grid */}
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {contentTypes.map((type, index) => {
          const IconComponent = type.icon;
          
          return (
            <MotionDiv
              key={type.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.2, 
                delay: 0.05 * index,
                ease: "easeOut"
              }}
              whileHover={{ 
                scale: 1.05, 
                y: -10,
                transition: { duration: 0.15 }
              }}
              whileTap={{ 
                scale: 0.98,
                transition: { duration: 0.1 }
              }}
              onClick={() => handlePostTypeClick(type.route)}
              className="group relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-2xl"
              style={{
                backgroundColor: 'rgb(238, 238, 238)',
                borderColor: type.color
              }}
            >
              {/* Hover Background Effect */}
              <MotionDiv
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 0.1 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 rounded-3xl"
                style={{ backgroundColor: type.color }}
              />
              
              <div className="relative text-center space-y-4">
                {/* Icon with Fast Bounce Animation */}
                <MotionDiv
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: 0.1 * index,
                    type: "spring", 
                    stiffness: 300,
                    damping: 20
                  }}
                  whileHover={{ 
                    scale: 1.1, 
                    rotate: 5,
                    transition: { duration: 0.15 }
                  }}
                  className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center transition-all duration-200"
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
                  <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgb(57, 62, 70)' }}>
                    {type.description}
                  </p>
                  
                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-1 justify-center">
                    {type.features.map((feature, featureIndex) => (
                      <MotionDiv
                        key={featureIndex}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          duration: 0.15, 
                          delay: 0.2 + (index * 0.05) + (featureIndex * 0.03)
                        }}
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: type.bgColor,
                          color: type.color
                        }}
                      >
                        {feature}
                      </MotionDiv>
                    ))}
                  </div>
                </div>

                {/* Fast Hover Arrow */}
                <MotionDiv
                  initial={{ opacity: 0, x: -20, scale: 0.8 }}
                  whileHover={{ 
                    opacity: 1, 
                    x: 0, 
                    scale: 1,
                    transition: { duration: 0.1 }
                  }}
                  className="absolute top-4 right-4"
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: type.color }}
                  >
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </MotionDiv>

                {/* Pulse Effect on Hover */}
                <MotionDiv
                  initial={{ scale: 0, opacity: 0 }}
                  whileHover={{ 
                    scale: [1, 1.2, 1], 
                    opacity: [0.3, 0.6, 0],
                    transition: { 
                      duration: 0.4,
                      repeat: Infinity,
                      repeatType: "loop"
                    }
                  }}
                  className="absolute inset-0 rounded-3xl border-2"
                  style={{ borderColor: type.color }}
                />
              </div>
            </MotionDiv>
          );
        })}
      </MotionDiv>

      {/* Quick Stats Section */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {[
          { 
            icon: Zap, 
            title: "Lightning Fast", 
            desc: "Create content in seconds",
            color: "rgb(0, 173, 181)",
            stat: "< 30s"
          },
          { 
            icon: Shield, 
            title: "Team Secure", 
            desc: "Protected collaboration",
            color: "rgb(57, 62, 70)",
            stat: "100%"
          },
          { 
            icon: TrendingUp, 
            title: "Multi-Platform", 
            desc: "YouTube, TikTok & more",
            color: "rgb(34, 40, 49)",
            stat: "5+ platforms"
          }
        ].map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <MotionDiv
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.2, 
                delay: 0.45 + index * 0.05,
                ease: "easeOut"
              }}
              whileHover={{ 
                y: -8, 
                scale: 1.03,
                transition: { duration: 0.15 }
              }}
              className="text-center p-6 rounded-2xl border-2 transition-all duration-200 group"
              style={{
                backgroundColor: 'rgba(238, 238, 238, 0.9)',
                borderColor: 'rgba(57, 62, 70, 0.2)'
              }}
            >
              <MotionDiv
                whileHover={{ 
                  scale: 1.15, 
                  rotate: 10,
                  transition: { duration: 0.15 }
                }}
                className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center transition-all duration-200"
                style={{ backgroundColor: 'rgba(0, 173, 181, 0.1)' }}
              >
                <IconComponent className="w-6 h-6" style={{ color: feature.color }} />
              </MotionDiv>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="font-bold" style={{ color: 'rgb(34, 40, 49)' }}>
                    {feature.title}
                  </h3>
                  <span 
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: feature.color,
                      color: 'white'
                    }}
                  >
                    {feature.stat}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'rgb(57, 62, 70)' }}>
                  {feature.desc}
                </p>
              </div>
            </MotionDiv>
          );
        })}
      </MotionDiv>

      {/* Call to Action */}
      <MotionDiv
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        whileHover={{ 
          scale: 1.02,
          transition: { duration: 0.15 }
        }}
        className="text-center p-8 rounded-3xl border-2 relative overflow-hidden"
        style={{
          backgroundColor: 'rgba(0, 173, 181, 0.05)',
          borderColor: 'rgba(0, 173, 181, 0.3)'
        }}
      >
        {/* Animated Background Pattern */}
        <MotionDiv
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute inset-0 opacity-5"
          style={{ backgroundColor: 'rgb(0, 173, 181)' }}
        />
        
        <div className="relative z-10">
          <MotionDiv
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.65 }}
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'rgb(0, 173, 181)' }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </MotionDiv>
          
          <h3 className="text-2xl font-bold mb-2" style={{ color: 'rgb(34, 40, 49)' }}>
            Ready to Create?
          </h3>
          <p className="text-lg" style={{ color: 'rgb(57, 62, 70)' }}>
            Choose a content type above to start creating amazing posts
          </p>
          
          {/* Floating Action Indicators */}
          <div className="flex justify-center gap-4 mt-6">
            {['📝', '🖼️', '✨', '🎬'].map((emoji, index) => (
              <MotionDiv
                key={index}
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2, 
                  delay: index * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-2xl"
              >
                {emoji}
              </MotionDiv>
            ))}
          </div>
        </div>
      </MotionDiv>
    </div>
  );
}