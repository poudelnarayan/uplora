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
  ArrowRight
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
      subtitle: "Quick thoughts & updates",
      icon: FileText,
      color: "#00ADB5",
      route: "/make-post/text",
      emoji: "📝",
     
    },
    {
      id: "image",
      title: "Image Post", 
      subtitle: "Visual stories & photos",
      icon: ImageIcon,
      color: "#393E46",
      route: "/make-post/image",
      emoji: "🖼️",
    },
    {
      id: "reel",
      title: "Short Reel",
      subtitle: "Viral short-form content",
      icon: Sparkles,
      color: "#222831",
      route: "/make-post/reel",
      emoji: "✨",
     
    },
    {
      id: "video",
      title: "YouTube Video",
      subtitle: "Professional long-form",
      icon: Youtube,
      color: "#FF0000",
      route: "/make-post/video",
      emoji: "🎬",
     
    }
  ];

  const handlePostTypeClick = (route: string) => {
    router.push(route);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">
      {/* Header Section */}
      <MotionDiv
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="text-center space-y-6"
      >
       
        
        {/* Main Title */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: 0.1 }}
          className="space-y-4"
        >
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
            <span style={{ color: 'rgb(34, 40, 49)' }}>Create </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-teal-600">
              Amazing Content
            </span>
          </h1>
          <p className="text-xl font-medium max-w-3xl mx-auto leading-relaxed" style={{ color: 'rgb(57, 62, 70)' }}>
            Choose your content type and start building posts that engage your audience
          </p>
        </MotionDiv>
      </MotionDiv>

      {/* Content Type Grid */}
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
      >
        {contentTypes.map((type, index) => {
          const IconComponent = type.icon;
          
          return (
            <MotionDiv
              key={type.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.15, 
                delay: 0.05 * index,
                ease: "easeOut"
              }}
              whileHover={{ 
                scale: 1.03, 
                y: -8,
                transition: { duration: 0.1 }
              }}
              whileTap={{ 
                scale: 0.98,
                transition: { duration: 0.05 }
              }}
              onClick={() => handlePostTypeClick(type.route)}
              className="group relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-100 shadow-xl hover:shadow-2xl"
              style={{
                backgroundColor: 'white',
                borderColor: type.color + '40'
              }}
            >
              {/* Floating Emoji */}
              <MotionDiv
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  duration: 0.15, 
                  delay: 0.1 + index * 0.02,
                  type: "spring",
                  stiffness: 500,
                  damping: 20
                }}
                className="absolute -top-6 -right-6 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-xl border-4 border-white"
                style={{ backgroundColor: type.color }}
              >
                {type.emoji}
              </MotionDiv>

              {/* Hover Arrow */}
              <MotionDiv
                initial={{ opacity: 0, x: -10, scale: 0.8 }}
                whileHover={{ 
                  opacity: 1, 
                  x: 0, 
                  scale: 1,
                  transition: { duration: 0.08 }
                }}
                className="absolute top-8 right-8"
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: type.color }}
                >
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
              </MotionDiv>

              {/* Main Content */}
              <div className="relative space-y-6">
                {/* Icon */}
                <MotionDiv
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    duration: 0.15, 
                    delay: 0.08 + index * 0.02,
                    type: "spring",
                    stiffness: 400,
                    damping: 20
                  }}
                  whileHover={{ 
                    scale: 1.1, 
                    rotate: 3,
                    transition: { duration: 0.08 }
                  }}
                  className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center shadow-xl"
                  style={{ backgroundColor: type.color }}
                >
                  <IconComponent className="w-12 h-12 text-white" />
                </MotionDiv>
                
                {/* Text Content */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2" style={{ color: 'rgb(34, 40, 49)' }}>
                      {type.title}
                    </h3>
                    <p className="text-base font-semibold mb-3" style={{ color: type.color }}>
                      {type.subtitle}
                    </p>
                    
                  </div>
                  
                 
                </div>
              </div>
            </MotionDiv>
          );
        })}
      </MotionDiv>
    </div>
  );
}