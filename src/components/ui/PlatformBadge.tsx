import { Badge } from "@/components/ui/badge";
import { Youtube, Instagram, Facebook, Linkedin, Twitter } from "lucide-react";

interface PlatformBadgeProps {
  platform: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  interactive?: boolean;
}

const PlatformBadge = ({ platform, size = "md", showIcon = true, interactive = true }: PlatformBadgeProps) => {
  const getPlatformIcon = (platform: string) => {
    const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
    
    switch (platform.toLowerCase()) {
      case "youtube":
        return <Youtube className={iconSize} />;
      case "instagram":
        return <Instagram className={iconSize} />;
      case "facebook":
        return <Facebook className={iconSize} />;
      case "linkedin":
        return <Linkedin className={iconSize} />;
      case "x (twitter)":
      case "twitter":
        return <Twitter className={iconSize} />;
      default:
        return null;
    }
  };

  const getPlatformStyles = (platform: string) => {
    const baseStyles = "transition-all duration-300";
    const hoverStyles = interactive ? "hover:scale-110 hover:shadow-lg" : "";
    
    switch (platform.toLowerCase()) {
      case "youtube":
        return `bg-red-500 text-white hover:bg-red-600 ${baseStyles} ${hoverStyles}`;
      case "tiktok": 
        return `bg-gray-900 text-white hover:bg-gray-800 ${baseStyles} ${hoverStyles}`;
      case "instagram":
        return `bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 ${baseStyles} ${hoverStyles}`;
      case "facebook":
        return `bg-blue-600 text-white hover:bg-blue-700 ${baseStyles} ${hoverStyles}`;
      case "linkedin":
        return `bg-blue-700 text-white hover:bg-blue-800 ${baseStyles} ${hoverStyles}`;
      case "x (twitter)":
      case "twitter":
        return `bg-sky-500 text-white hover:bg-sky-600 ${baseStyles} ${hoverStyles}`;
      default:
        return `bg-muted text-muted-foreground ${baseStyles}`;
    }
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-1 gap-1",
    md: "text-sm px-3 py-1.5 gap-2",
    lg: "text-base px-4 py-2 gap-2"
  };

  return (
    <Badge 
      className={`${getPlatformStyles(platform)} ${sizeClasses[size]} font-medium flex items-center${interactive ? ' cursor-pointer' : ''}`}
    >
      {showIcon && getPlatformIcon(platform)}
      {platform}
    </Badge>
  );
};

export default PlatformBadge;