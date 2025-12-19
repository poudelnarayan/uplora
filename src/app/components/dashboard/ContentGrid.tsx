"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Share,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { StatusChip } from '@/app/components/ui/StatusChip';
import { LoadingSpinner, CardSkeleton } from '@/app/components/ui/loading-spinner';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const MotionDiv = motion.div as any;

export type ContentType = 'video' | 'image' | 'text' | 'reel';

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  content?: string;
  thumbnail?: string;
  thumbnailKey?: string | null;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'PROCESSING' | 'PENDING';
  platforms: string[];
  createdAt: string;
  updatedAt: string;
  scheduledFor?: string | null;
  userRole?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EDITOR' | null;
  uploader?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  metadata?: any;
}

interface ContentGridProps {
  content: ContentItem[];
  loading: boolean;
  onStatusChange?: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  deletingId?: string | null;
  processingId?: string | null;
}

const getContentIcon = (type: ContentType) => {
  switch (type) {
    case 'video':
      return <Video className="w-4 h-4" />;
    case 'image':
      return <ImageIcon className="w-4 h-4" />;
    case 'text':
      return <FileText className="w-4 h-4" />;
    case 'reel':
      return <Play className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getContentTypeColor = (type: ContentType) => {
  switch (type) {
    case 'video':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'image':
      return 'bg-accent/10 text-accent-foreground border-accent/20';
    case 'text':
      return 'bg-success/10 text-success border-success/20';
    case 'reel':
      return 'bg-warning/10 text-warning border-warning/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
  return date.toLocaleDateString();
};

const ContentCard: React.FC<{
  item: ContentItem;
  onStatusChange?: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  deletingId?: string | null;
  processingId?: string | null;
}> = ({ item, onStatusChange, onDelete, onEdit, onView, deletingId, processingId }) => {
  const router = useRouter();
  const isDeleting = deletingId === item.id;
  const isProcessing = processingId === item.id;

  const handleView = () => {
    if (onView) {
      onView(item.id);
    } else {
      // Default navigation based on content type
      if (item.type === 'video') {
        router.push(`/videos/${item.id}`);
      } else {
        router.push(`/dashboard`);
      }
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(item.id);
    } else {
      // Default navigation to edit based on content type
      switch (item.type) {
        case 'video':
          router.push(`/make-post/video`);
          break;
        case 'image':
          router.push(`/make-post/image`);
          break;
        case 'text':
          router.push(`/make-post/text`);
          break;
        case 'reel':
          router.push(`/make-post/reel`);
          break;
      }
    }
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border-0 bg-white">
        <CardContent className="p-0">
          {/* Thumbnail/Preview */}
          <div className="relative aspect-video bg-gray-100 overflow-hidden">
            {item.thumbnail ? (
              <Image
                src={item.thumbnail}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                {getContentIcon(item.type)}
              </div>
            )}
            
            {/* Content Type Badge */}
            <div className="absolute top-2 left-2">
              <Badge 
                variant="secondary" 
                className={`text-xs font-medium ${getContentTypeColor(item.type)}`}
              >
                {getContentIcon(item.type)}
                <span className="ml-1 capitalize">{item.type}</span>
              </Badge>
            </div>

            {/* Status Badge */}
            <div className="absolute top-2 right-2">
              <StatusChip status={item.status} />
            </div>

            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleView}
                  className="bg-white/90 hover:bg-white"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleEdit}
                  className="bg-white/90 hover:bg-white"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content Info */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-sm line-clamp-2 text-gray-900 break-words">
                {item.title}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleView}>
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(item.id)}
                    className="text-red-600"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Content Preview */}
            {item.content && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-3 break-words">
                {item.content}
              </p>
            )}

            {/* Platforms */}
            {item.platforms.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {item.platforms.slice(0, 3).map((platform) => (
                  <Badge key={platform} variant="outline" className="text-xs">
                    {platform}
                  </Badge>
                ))}
                {item.platforms.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{item.platforms.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                {item.uploader && (
                  <>
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={item.uploader.image} />
                      <AvatarFallback className="text-xs">
                        {item.uploader.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{item.uploader.name}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                {item.scheduledFor ? (
                  <>
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(item.scheduledFor)}</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(item.createdAt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </MotionDiv>
  );
};

export const ContentGrid: React.FC<ContentGridProps> = ({
  content,
  loading,
  onStatusChange,
  onDelete,
  onEdit,
  onView,
  deletingId,
  processingId
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} className="h-80" />
        ))}
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No content yet</h3>
        <p className="text-gray-600 mb-6">Create your first post, video, or reel to get started.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => window.location.href = '/make-post/text'}>
            <FileText className="w-4 h-4 mr-2" />
            Create Text Post
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/make-post/image'}>
            <ImageIcon className="w-4 h-4 mr-2" />
            Create Image Post
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {content.map((item) => (
        <ContentCard
          key={item.id}
          item={item}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          onEdit={onEdit}
          onView={onView}
          deletingId={deletingId}
          processingId={processingId}
        />
      ))}
    </div>
  );
};

export default ContentGrid;
