"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Youtube,
  Sparkles,
  Send,
  Upload,
  User,
  Users,
  Zap,
  Target,
  Shield
} from "lucide-react";
import { useNotifications } from "@/components/ui/Notification";
import { useRouter } from "next/navigation";
import { useUploads } from "@/context/UploadContext";

const MotionDiv = motion.div as any;

interface MakePostInterfaceProps {
  selectedTeam?: { name: string } | null;
  selectedTeamId: string | null;
}

type ContentType = "text" | "post" | "reel" | "video";

export default function MakePostInterface({ selectedTeam, selectedTeamId }: MakePostInterfaceProps) {
  const [selectedType, setSelectedType] = useState<ContentType>("text");
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const notifications = useNotifications();
  const router = useRouter();
  const { enqueueUpload, hasActive } = useUploads();

  const contentTypes = [
    {
      id: "text" as ContentType,
      title: "Text Post",
      subtitle: "Share thoughts",
      icon: FileText,
      color: "rgb(0, 173, 181)",
      bgColor: "rgba(0, 173, 181, 0.1)",
      description: "Quick text updates and announcements"
    },
    {
      id: "post" as ContentType,
      title: "Image Post",
      subtitle: "Visual content",
      icon: ImageIcon,
      color: "rgb(57, 62, 70)",
      bgColor: "rgba(57, 62, 70, 0.1)",
      description: "Photos and graphics for social media"
    },
    {
      id: "reel" as ContentType,
      title: "Short Reel",
      subtitle: "Quick videos",
      icon: Sparkles,
      color: "rgb(34, 40, 49)",
      bgColor: "rgba(34, 40, 49, 0.1)",
      description: "Short-form content for TikTok, Instagram"
    },
    {
      id: "video" as ContentType,
      title: "Long Video",
      subtitle: "YouTube content",
      icon: Youtube,
      color: "rgb(0, 173, 181)",
      bgColor: "rgba(0, 173, 181, 0.1)",
      description: "Full-length videos for YouTube"
    }
  ];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (selectedType !== "text") {
      setIsDragOver(true);
    }
  }, [selectedType]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (selectedType === "text" || hasActive || isCreating) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    let validFile: File | null = null;
    
    if (selectedType === "post") {
      validFile = droppedFiles.find(file => file.type.startsWith('image/')) || null;
    } else if (selectedType === "reel" || selectedType === "video") {
      validFile = droppedFiles.find(file => file.type.startsWith('video/')) || null;
    }
    
    if (validFile) {
      setFile(validFile);
      notifications.addNotification({ 
        type: "success", 
        title: "File selected!", 
        message: `${validFile.name} is ready to upload` 
      });
    } else {
      const expectedType = selectedType === "post" ? "image" : "video";
      notifications.addNotification({ 
        type: "error", 
        title: "Invalid file type", 
        message: `Please drop a ${expectedType} file` 
      });
    }
  }, [selectedType, hasActive, isCreating, notifications]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      notifications.addNotification({ 
        type: "success", 
        title: "File selected!", 
        message: `${selectedFile.name} is ready to upload` 
      });
    }
  };

  const handleCreate = async () => {
    if (selectedType === "text") {
      if (!textContent.trim()) return;
      
      setIsCreating(true);
      // Simulate text post creation
      setTimeout(() => {
        notifications.addNotification({
          type: "success",
          title: "Text post created!",
          message: "Your post has been shared successfully"
        });
        setTextContent("");
        setIsCreating(false);
        router.push("/dashboard");
      }, 1500);
    } else {
      if (!file) return;
      
      setIsCreating(true);
      try {
        const uploadId = enqueueUpload(file, selectedTeamId);
        notifications.addNotification({ 
          type: "info", 
          title: "Creating content...", 
          message: "Your content is being processed",
          sticky: true,
          stickyConditions: {
            dismissOnRouteChange: true,
            dismissAfterSeconds: 25
          }
        });
        
        // Reset form
        setFile(null);
        router.push("/dashboard");
      } catch (error) {
        notifications.addNotification({
          type: "error",
          title: "Creation failed",
          message: "Please try again"
        });
      } finally {
        setIsCreating(false);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

      {/* Content Type Selector */}
      <MotionDiv
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {contentTypes.map((type, index) => {
          const IconComponent = type.icon;
          const isSelected = selectedType === type.id;
          
          return (
            <MotionDiv
              key={type.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelectedType(type.id);
                setFile(null);
                setTextContent("");
              }}
              className={`
                relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300
                ${isSelected ? 'shadow-xl' : 'shadow-md hover:shadow-lg'}
              `}
              style={{
                backgroundColor: isSelected ? type.bgColor : 'rgb(238, 238, 238)',
                borderColor: isSelected ? type.color : 'rgba(57, 62, 70, 0.2)',
                color: isSelected ? type.color : 'rgb(57, 62, 70)'
              }}
            >
              {isSelected && (
                <MotionDiv
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: type.color }}
                >
                  <div className="w-2 h-2 rounded-full bg-white" />
                </MotionDiv>
              )}
              
              <div className="text-center space-y-3">
                <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center transition-all duration-300 ${isSelected ? 'scale-110' : ''}`}
                  style={{ backgroundColor: isSelected ? type.color : 'rgba(57, 62, 70, 0.1)' }}
                >
                  <IconComponent className={`w-6 h-6 ${isSelected ? 'text-white' : ''}`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{type.title}</h3>
                  <p className="text-sm opacity-80">{type.subtitle}</p>
                </div>
              </div>
            </MotionDiv>
          );
        })}
      </MotionDiv>

      {/* Content Creation Area */}
      <AnimatePresence mode="wait">
        <MotionDiv
          key={selectedType}
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.95 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="rounded-3xl p-8 border-2 shadow-2xl"
          style={{
            backgroundColor: 'rgb(238, 238, 238)',
            borderColor: 'rgba(0, 173, 181, 0.3)'
          }}
        >
          {selectedType === "text" ? (
            <TextPostCreator
              content={textContent}
              onChange={setTextContent}
              onSubmit={handleCreate}
              isCreating={isCreating}
            />
          ) : (
            <MediaPostCreator
              type={selectedType}
              file={file}
              isDragOver={isDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onFileSelect={handleFileSelect}
              onSubmit={handleCreate}
              onRemoveFile={() => setFile(null)}
              isCreating={isCreating}
              hasActive={hasActive}
              formatFileSize={formatFileSize}
            />
          )}
        </MotionDiv>
      </AnimatePresence>

      {/* Features Section */}
      <MotionDiv
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {[
          { icon: Zap, title: "Lightning Fast", desc: "Quick content creation" },
          { icon: Shield, title: "Secure", desc: "Protected uploads" },
          { icon: Target, title: "Multi-Platform", desc: "YouTube, TikTok & more" }
        ].map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <MotionDiv
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -5 }}
              className="text-center p-6 rounded-2xl border"
              style={{
                backgroundColor: 'rgba(238, 238, 238, 0.8)',
                borderColor: 'rgba(57, 62, 70, 0.2)'
              }}
            >
              <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0, 173, 181, 0.1)' }}
              >
                <IconComponent className="w-6 h-6" style={{ color: 'rgb(0, 173, 181)' }} />
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
    </div>
  );
}

// Text Post Creator Component
function TextPostCreator({ 
  content, 
  onChange, 
  onSubmit, 
  isCreating 
}: {
  content: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isCreating: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <MotionDiv
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
          className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center"
          style={{ backgroundColor: 'rgb(0, 173, 181)' }}
        >
          <FileText className="w-10 h-10 text-white" />
        </MotionDiv>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'rgb(34, 40, 49)' }}>
            Share Your Thoughts
          </h2>
          <p style={{ color: 'rgb(57, 62, 70)' }}>
            What's on your mind today?
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="What's happening? Share your thoughts with your audience..."
          className="w-full h-32 p-4 rounded-xl border-2 resize-none transition-all duration-300 focus:scale-[1.02]"
          style={{
            backgroundColor: 'white',
            borderColor: content.length > 0 ? 'rgb(0, 173, 181)' : 'rgba(57, 62, 70, 0.3)',
            color: 'rgb(34, 40, 49)'
          }}
          maxLength={280}
        />
        
        <div className="flex justify-between items-center">
          <span className="text-sm" style={{ color: 'rgb(57, 62, 70)' }}>
            {content.length}/280 characters
          </span>
          <div className="w-16 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(57, 62, 70, 0.2)' }}>
            <div 
              className="h-full transition-all duration-300 rounded-full"
              style={{ 
                width: `${(content.length / 280) * 100}%`,
                backgroundColor: content.length > 250 ? 'rgb(239, 68, 68)' : 'rgb(0, 173, 181)'
              }}
            />
          </div>
        </div>
      </div>

      <MotionDiv
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <button
          onClick={onSubmit}
          disabled={!content.trim() || content.length > 280 || isCreating}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          style={{
            backgroundColor: content.trim() && content.length <= 280 ? 'rgb(0, 173, 181)' : 'rgba(57, 62, 70, 0.3)',
            color: 'white'
          }}
        >
          {isCreating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating Post...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Share Post
            </>
          )}
        </button>
      </MotionDiv>
    </div>
  );
}

// Media Post Creator Component
function MediaPostCreator({
  type,
  file,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onSubmit,
  onRemoveFile,
  isCreating,
  hasActive,
  formatFileSize
}: {
  type: ContentType;
  file: File | null;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onRemoveFile: () => void;
  isCreating: boolean;
  hasActive: boolean;
  formatFileSize: (bytes: number) => string;
}) {
  const getTypeConfig = () => {
    switch (type) {
      case "post":
        return {
          title: "Upload Image",
          subtitle: "Share photos and graphics",
          icon: ImageIcon,
          accept: "image/*",
          formats: ["JPG", "PNG", "GIF", "WebP"],
          color: "rgb(57, 62, 70)"
        };
      case "reel":
        return {
          title: "Upload Short Video",
          subtitle: "Create engaging reels",
          icon: Sparkles,
          accept: "video/*",
          formats: ["MP4", "MOV", "WebM"],
          color: "rgb(34, 40, 49)"
        };
      case "video":
        return {
          title: "Upload Long Video",
          subtitle: "Create YouTube content",
          icon: Youtube,
          accept: "video/*",
          formats: ["MP4", "MOV", "AVI", "WebM", "MKV"],
          color: "rgb(0, 173, 181)"
        };
      default:
        return {
          title: "Upload Media",
          subtitle: "Share your content",
          icon: Upload,
          accept: "*/*",
          formats: [],
          color: "rgb(0, 173, 181)"
        };
    }
  };

  const config = getTypeConfig();
  const IconComponent = config.icon;

  if (!file) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <MotionDiv
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
            className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center"
            style={{ backgroundColor: config.color }}
          >
            <IconComponent className="w-10 h-10 text-white" />
          </MotionDiv>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'rgb(34, 40, 49)' }}>
              {config.title}
            </h2>
            <p style={{ color: 'rgb(57, 62, 70)' }}>
              {config.subtitle}
            </p>
          </div>
        </div>

        <MotionDiv
          animate={{
            scale: isDragOver ? 1.02 : 1,
            borderColor: isDragOver ? config.color : 'rgba(57, 62, 70, 0.3)'
          }}
          transition={{ duration: 0.2 }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => {
            if (hasActive || isCreating) return;
            document.getElementById('file-input')?.click();
          }}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300 hover:scale-[1.01]
            ${hasActive || isCreating ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{
            backgroundColor: isDragOver ? 'rgba(0, 173, 181, 0.05)' : 'white',
            borderColor: isDragOver ? config.color : 'rgba(57, 62, 70, 0.3)'
          }}
        >
          <input
            id="file-input"
            type="file"
            accept={config.accept}
            onChange={onFileSelect}
            className="hidden"
            disabled={hasActive || isCreating}
          />
          
          <div className="space-y-4">
            <MotionDiv
              animate={{ y: isDragOver ? -5 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0, 173, 181, 0.1)' }}
            >
              <Upload className="w-8 h-8" style={{ color: 'rgb(0, 173, 181)' }} />
            </MotionDiv>
            
            <div>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'rgb(34, 40, 49)' }}>
                {isDragOver ? `Drop your ${type} here!` : `Drag & drop or click to browse`}
              </h3>
              <p style={{ color: 'rgb(57, 62, 70)' }}>
                {hasActive 
                  ? "Please wait for current upload to finish" 
                  : `Select your ${type === "post" ? "image" : "video"} file`
                }
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {config.formats.map(format => (
                <span
                  key={format}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: 'rgba(57, 62, 70, 0.1)',
                    color: 'rgb(57, 62, 70)'
                  }}
                >
                  {format}
                </span>
              ))}
            </div>
          </div>
        </MotionDiv>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* File Preview */}
      <MotionDiv
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="p-6 rounded-2xl border-2"
        style={{
          backgroundColor: 'white',
          borderColor: 'rgb(0, 173, 181)'
        }}
      >
        <div className="flex items-center gap-4">
          <MotionDiv
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="w-16 h-16 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0, 173, 181, 0.1)' }}
          >
            <IconComponent className="w-8 h-8" style={{ color: 'rgb(0, 173, 181)' }} />
          </MotionDiv>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate" style={{ color: 'rgb(34, 40, 49)' }}>
              {file.name}
            </h3>
            <p style={{ color: 'rgb(57, 62, 70)' }}>
              {formatFileSize(file.size)} • {file.type.split('/')[1]?.toUpperCase()}
            </p>
          </div>
          
          {!isCreating && (
            <MotionDiv
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <button
                onClick={onRemoveFile}
                className="p-2 rounded-full transition-all duration-200"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: 'rgb(239, 68, 68)'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </MotionDiv>
          )}
        </div>
      </MotionDiv>

      {/* Create Button */}
      <MotionDiv
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <button
          onClick={onSubmit}
          disabled={isCreating || hasActive}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          style={{
            backgroundColor: 'rgb(0, 173, 181)',
            color: 'white'
          }}
        >
          {isCreating || hasActive ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating {type === "post" ? "Post" : type === "reel" ? "Reel" : "Video"}...
            </>
          ) : (
            <>
              <IconComponent className="w-5 h-5" />
              Create {type === "post" ? "Post" : type === "reel" ? "Reel" : "Video"}
            </>
          )}
        </button>
      </MotionDiv>

      {/* Cancel Button for Active Uploads */}
      {(isCreating || hasActive) && (
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={() => {
              // Cancel logic would go here
              notifications.addNotification({
                type: "info",
                title: "Creation cancelled",
                message: "Your content creation has been cancelled"
              });
            }}
            className="w-full py-3 rounded-xl font-medium transition-all duration-300 border-2"
            style={{
              backgroundColor: 'transparent',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: 'rgb(239, 68, 68)'
            }}
          >
            Cancel Creation
          </button>
        </MotionDiv>
      )}
    </div>
  );
}