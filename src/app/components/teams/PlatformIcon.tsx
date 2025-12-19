import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube
} from "lucide-react";
import { PLATFORM_BRAND_COLORS } from '@/config/colors';

export const platformIcons = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube
};

export const platformColors = {
  facebook: PLATFORM_BRAND_COLORS.facebook,
  instagram: PLATFORM_BRAND_COLORS.instagram,
  twitter: PLATFORM_BRAND_COLORS.twitter,
  linkedin: PLATFORM_BRAND_COLORS.linkedin,
  youtube: PLATFORM_BRAND_COLORS.youtube
};

interface PlatformIconProps {
  platform: string;
  size?: "sm" | "md" | "lg";
}

export const PlatformIcon = ({ platform, size = "md" }: PlatformIconProps) => {
  const Icon = platformIcons[platform as keyof typeof platformIcons];
  const color = platformColors[platform as keyof typeof platformColors];
  
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5", 
    lg: "h-6 w-6"
  };

  if (!Icon) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
      <Icon className={`${sizeClasses[size]}`} style={{ color }} />
      <span className="text-xs font-medium capitalize">{platform}</span>
    </div>
  );
};