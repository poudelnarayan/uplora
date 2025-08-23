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
  TrendingUp,
  Play,
  Camera,
  Edit,
  Rocket
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
      subtitle: "Quick thoughts",
      icon: FileText,
      color: "#00ADB5",
      bgGradient: "from-cyan-500/10 to-teal-500/10",
      borderColor: "border-cyan-400/30",
      hoverBg: "hover:bg-cyan-50/50",
      description: "Share updates instantly",
      route: "/make-post/text",
      features: ["280 chars", "Instant", "Viral"],
      emoji: "📝",
      stats: "< 5s"
    },
    {
      id: "image",
      title: "Image Post", 
      subtitle: "Visual stories",
      icon: ImageIcon,
      color: "#393E46",
      bgGradient: "from-slate-500/10 to-gray-500/10",
      borderColor: "border-slate-400/30",
      hoverBg: "hover:bg-slate-50/50",
      description: "Share photos & graphics",
      route: "/make-post/image",
      features: ["HD Quality", "Multi-format", "Social"],
      emoji: "🖼️",
      stats: "< 10s"
    },
    {
      id: "reel",
      title: "Short Reel",
      subtitle: "Viral content",
      icon: Sparkles,
      color: "#222831",
      bgGradient: "from-purple-500/10 to-pink-500/10",
      borderColor: "border-purple-400/30",
      hoverBg: "hover:bg-purple-50/50",
      description: "TikTok & Instagram ready",
      route: "/make-post/reel",
      features: ["Viral", "Trending", "Quick"],
      emoji: "✨",
      stats: "< 15s"
    },
    {
      id: "video",
      title: "YouTube Video",
      subtitle: "Professional",
      icon: Youtube,
      color: "#FF0000",
      bgGradient: "from-red-500/10 to-orange-500/10",
      borderColor: "border-red-400/30",
      hoverBg: "hover:bg-red-50/50",
      description: "Long-form content",
      route: "/make-post/video",
      features: ["HD Upload", "Analytics", "Monetize"],
      emoji: "🎬",
      stats: "< 30s"
    }
  ];

  const handlePostTypeClick = (route: string) => {
    router.push(route);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-12">
      {/* Header Section */}
      <MotionDiv
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center space-y-6"
      >
        {/* Workspace Badge */}
        <MotionDiv
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 shadow-lg backdrop-blur-sm"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: 'rgb(0, 173, 181)',
            color: 'rgb(0, 173, 181)'
          }}
        >
          {selectedTeam ? (
            <>
              <Users className="w-5 h-5" />
              <span className="font-bold">Team: {selectedTeam.name}</span>
            </>
          ) : (
            <>
              <User className="w-5 h-5" />
              <span className="font-bold">Personal Workspace</span>
            </>
          )}
        </MotionDiv>
        
        {/* Main Title */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-4"
        >
          <h1 className="text-6xl font-black tracking-tight" style={{ color: 'rgb(34, 40, 49)' }}>
            Create
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-teal-600">
              Amazing Content
            </span>
          </h1>
          <p className="text-xl font-medium max-w-2xl mx-auto" style={{ color: 'rgb(57, 62, 70)' }}>
            Choose your content type and start creating engaging posts that captivate your audience
          </p>
        </MotionDiv>
      </MotionDiv>

      {/* Content Type Grid */}
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
      >
        {contentTypes.map((type, index) => {
          const IconComponent = type.icon;
          
          return (
            <MotionDiv
              key={type.id}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.3, 
                delay: 0.1 * index,
                ease: "easeOut"
              }}
              whileHover={{ 
                scale: 1.05, 
                y: -12,
                transition: { duration: 0.2 }
              }}
              whileTap={{ 
                scale: 0.98,
                transition: { duration: 0.1 }
              }}
              onClick={() => handlePostTypeClick(type.route)}
              className={`
                group relative p-8 rounded-3xl border-2 cursor-pointer 
                transition-all duration-300 shadow-xl hover:shadow-2xl
                bg-gradient-to-br ${type.bgGradient} ${type.borderColor} ${type.hoverBg}
                backdrop-blur-sm
              `}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderColor: type.color + '40'
              }}
            >
              {/* Floating Emoji */}
              <MotionDiv
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: 0.2 + index * 0.1,
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }}
                className="absolute -top-4 -right-4 w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg"
                style={{ backgroundColor: 'white', border: `2px solid ${type.color}` }}
              >
                {type.emoji}
              </MotionDiv>

              {/* Hover Arrow */}
              <MotionDiv
                initial={{ opacity: 0, x: -20, scale: 0.8 }}
                whileHover={{ 
                  opacity: 1, 
                  x: 0, 
                  scale: 1,
                  transition: { duration: 0.2 }
                }}
                className="absolute top-6 right-6"
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: type.color }}
                >
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </MotionDiv>

              {/* Main Content */}
              <div className="relative text-center space-y-6">
                {/* Icon */}
                <MotionDiv
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: 0.15 + index * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                  whileHover={{ 
                    scale: 1.1, 
                    rotate: 5,
                    transition: { duration: 0.2 }
                  }}
                  className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: type.color }}
                >
                  <IconComponent className="w-10 h-10 text-white" />
                </MotionDiv>
                
                {/* Text Content */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-2xl font-bold mb-1" style={{ color: 'rgb(34, 40, 49)' }}>
                      {type.title}
                    </h3>
                    <p className="text-sm font-semibold" style={{ color: type.color }}>
                      {type.subtitle}
                    </p>
                  </div>
                  
                  <p className="text-sm leading-relaxed" style={{ color: 'rgb(57, 62, 70)' }}>
                    {type.description}
                  </p>
                  
                  {/* Stats Badge */}
                  <div className="flex items-center justify-center gap-2">
                    <span 
                      className="text-xs font-bold px-3 py-1 rounded-full text-white"
                      style={{ backgroundColor: type.color }}
                    >
                      {type.stats}
                    </span>
                    <span className="text-xs font-medium" style={{ color: 'rgb(57, 62, 70)' }}>
                      to create
                    </span>
                  </div>
                  
                  {/* Feature Tags */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {type.features.map((feature, featureIndex) => (
                      <MotionDiv
                        key={featureIndex}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          duration: 0.2, 
                          delay: 0.3 + (index * 0.05) + (featureIndex * 0.02)
                        }}
                        className="px-3 py-1 rounded-full text-xs font-medium border"
                        style={{
                          backgroundColor: type.color + '15',
                          color: type.color,
                          borderColor: type.color + '30'
                        }}
                      >
                        {feature}
                      </MotionDiv>
                    ))}
                  </div>
                </div>

                {/* Pulse Effect on Hover */}
                <MotionDiv
                  initial={{ scale: 0, opacity: 0 }}
                  whileHover={{ 
                    scale: [1, 1.1, 1], 
                    opacity: [0.3, 0.6, 0],
                    transition: { 
                      duration: 0.6,
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

      {/* Bottom Stats Section */}
      <MotionDiv
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {[
          { 
            icon: Zap, 
            title: "Lightning Fast", 
            desc: "Create content in seconds",
            color: "#00ADB5",
            stat: "< 30s"
          },
          { 
            icon: Shield, 
            title: "Team Secure", 
            desc: "Protected collaboration",
            color: "#393E46",
            stat: "100%"
          },
          { 
            icon: TrendingUp, 
            title: "Multi-Platform", 
            desc: "YouTube, TikTok & more",
            color: "#222831",
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
                duration: 0.3, 
                delay: 0.7 + index * 0.1,
                ease: "easeOut"
              }}
              whileHover={{ 
                y: -8, 
                scale: 1.03,
                transition: { duration: 0.2 }
              }}
              className="text-center p-8 rounded-2xl border-2 transition-all duration-200 group shadow-lg hover:shadow-xl"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderColor: feature.color + '30'
              }}
            >
              <MotionDiv
                whileHover={{ 
                  scale: 1.2, 
                  rotate: 10,
                  transition: { duration: 0.2 }
                }}
                className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg"
                style={{ backgroundColor: feature.color }}
              >
                <IconComponent className="w-8 h-8 text-white" />
              </MotionDiv>
              
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <h3 className="font-bold text-lg" style={{ color: 'rgb(34, 40, 49)' }}>
                    {feature.title}
                  </h3>
                  <span 
                    className="text-xs font-bold px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: feature.color }}
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
        transition={{ duration: 0.4, delay: 0.9 }}
        whileHover={{ 
          scale: 1.02,
          transition: { duration: 0.2 }
        }}
        className="text-center p-12 rounded-3xl border-2 relative overflow-hidden shadow-2xl"
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
            duration: 12, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute inset-0 opacity-5"
          style={{ backgroundColor: 'rgb(0, 173, 181)' }}
        />
        
        <div className="relative z-10 space-y-6">
          <MotionDiv
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 1 }}
            className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-xl"
            style={{ backgroundColor: 'rgb(0, 173, 181)' }}
          >
            <Rocket className="w-10 h-10 text-white" />
          </MotionDiv>
          
          <div className="space-y-4">
            <h3 className="text-3xl font-black" style={{ color: 'rgb(34, 40, 49)' }}>
              Ready to Create Magic?
            </h3>
            <p className="text-lg font-medium max-w-2xl mx-auto" style={{ color: 'rgb(57, 62, 70)' }}>
              Choose a content type above and start building content that engages, inspires, and converts
            </p>
          </div>
          
          {/* Floating Action Indicators */}
          <div className="flex justify-center gap-6 mt-8">
            {['📝', '🖼️', '✨', '🎬'].map((emoji, index) => (
              <MotionDiv
                key={index}
                animate={{ 
                  y: [0, -15, 0],
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 3, 
                  delay: index * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-4xl filter drop-shadow-lg"
              >
                {emoji}
              </MotionDiv>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-8 text-sm font-medium" style={{ color: 'rgb(57, 62, 70)' }}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'rgb(0, 173, 181)' }} />
              <span>4 Content Types</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'rgb(57, 62, 70)' }} />
              <span>Instant Creation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'rgb(34, 40, 49)' }} />
              <span>Multi-Platform</span>
            </div>
          </div>
        </div>
      </MotionDiv>
    </div>
  );
}