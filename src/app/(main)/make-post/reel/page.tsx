"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { 
  Play, 
  ArrowLeft, 
  Upload, 
  Send, 
  Save,
  X,
  Eye,
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  MoreHorizontal,
  Plus
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import PlatformBadge from  "@/app/components/ui/PlatformBadge";
import RichTextEditor from "@/app/components/editor/RichTextEditor";
import { useTeam } from "@/context/TeamContext";
import { useNotifications } from "@/app/components/ui/Notification";
import { InlineSpinner } from "@/app/components/ui/loading-spinner";
import AppShell from "@/app/components/layout/AppLayout";
import { useSearchParams } from "next/navigation";

function MakePostReelsContent() {
  const router = useRouter();
  const { selectedTeamId, selectedTeam } = useTeam();
  const notifications = useNotifications();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  
  const [dragActive, setDragActive] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram", "TikTok"]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState<boolean>(!!editId);

  const platforms = [
    { id: "Instagram", name: "Instagram", limit: 2200 },
    { id: "TikTok", name: "TikTok", limit: 2200 },
    { id: "YouTube", name: "YouTube", limit: 5000 },
    { id: "Facebook", name: "Facebook", limit: 63206 }
  ];

  // Load existing post for edit
  useEffect(() => {
    const load = async () => {
      if (!editId) return;
      try {
        const res = await fetch(`/api/content/${editId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load post');
        setTitle(data.title || "");
        setContent(data.content || "");
        if (Array.isArray(data.platforms)) setSelectedPlatforms(data.platforms);
        if (data.videoKey) {
          const urlRes = await fetch(`/api/s3/get-url?key=${encodeURIComponent(data.videoKey)}`);
          const { url } = await urlRes.json();
          if (url) setSelectedVideo(url);
        }
      } catch (e) {
        notifications.addNotification({ type: 'error', title: 'Failed to load', message: e instanceof Error ? e.message : 'Try again' });
      } finally {
        setLoadingExisting(false);
      }
    };
    load();
  }, [editId, notifications]);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedVideo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedVideo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatContentWithColors = (text: string) => {
    if (!text) return <span className="text-gray-400">Your amazing reel caption goes here... #trending #viral</span>;
    
    return text.split(/(\s+)/).map((word, index) => {
      if (word.startsWith('#')) {
        return <span key={index} className="text-blue-400 font-medium">{word}</span>;
      } else if (word.startsWith('@')) {
        return <span key={index} className="text-purple-400 font-medium">{word}</span>;
      } else if (word.match(/https?:\/\/[^\s]+/) || word.match(/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/)) {
        return <span key={index} className="text-green-400 font-medium underline">{word}</span>;
      } else if (word.startsWith('**') && word.endsWith('**')) {
        const content = word.slice(2, -2);
        return content ? <span key={index} className="font-bold">{content}</span> : <span key={index}>{word}</span>;
      } else if (word.startsWith('*') && word.endsWith('*') && !word.startsWith('**')) {
        const content = word.slice(1, -1);
        return content ? <span key={index} className="italic">{content}</span> : <span key={index}>{word}</span>;
      } else if (word.startsWith('^') && word.endsWith('^') && !word.startsWith('^^')) {
        const content = word.slice(1, -1);
        return content ? <span key={index} className="text-2xl font-bold text-white">{content}</span> : <span key={index}>{word}</span>;
      } else if (word.startsWith('^^') && word.endsWith('^^')) {
        const content = word.slice(2, -2);
        return content ? <span key={index} className="text-xl font-semibold text-white">{content}</span> : <span key={index}>{word}</span>;
      }
      return <span key={index}>{word}</span>;
    });
  };

  const uploadReelToS3 = async (file: File): Promise<string> => {
    try {
      // Get presigned URL
      const presignResponse = await fetch('/api/s3/presign-reel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          sizeBytes: file.size,
          teamId: selectedTeamId
        })
      });

      if (!presignResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { putUrl, key } = await presignResponse.json();

      // Upload file to S3
      const uploadResponse = await fetch(putUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload reel');
      }

      return key;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw error;
    }
  };

  // Instagram Reel Preview Component
  const InstagramReelPreview = () => (
    <div className="w-80 h-[600px] bg-black rounded-3xl overflow-hidden relative mx-auto shadow-2xl">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-6 py-3 text-white text-sm font-medium">
        <span>9:05</span>
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
          <svg className="w-4 h-4 ml-1" fill="white" viewBox="0 0 24 24">
            <path d="M2 17h20v2H2zm1.15-4.05L4 11l.85 1.95L6.8 13l-1.95.85L4 15.8l-.85-1.95L1.2 13l1.95-.85zM6.5 3L8 6.5 11.5 8 8 9.5 6.5 13 5 9.5 1.5 8 5 6.5 6.5 3zm5.5 6L13.5 12 17 13.5 13.5 15 12 18.5 10.5 15 7 13.5 10.5 12 12 9z"/>
          </svg>
          <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">76</span>
        </div>
      </div>

      {/* Video Content */}
      <div className="w-full h-full relative">
        {selectedVideo ? (
          <video
            src={selectedVideo}
            className="w-full h-full object-cover"
            muted
            loop
            autoPlay
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
            <Play className="h-16 w-16 text-white/80" />
          </div>
        )}

        {/* Right Side Actions */}
        <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
          {/* Profile */}
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-white">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" />
              <AvatarFallback>YB</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
              <Plus className="h-3 w-3 text-white" />
            </div>
          </div>

          {/* Like */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center">
              <Heart className="h-7 w-7 text-white drop-shadow-lg" />
            </div>
            <span className="text-white text-xs font-semibold drop-shadow-lg">Likes</span>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center">
              <MessageCircle className="h-7 w-7 text-white drop-shadow-lg" />
            </div>
            <span className="text-white text-xs font-semibold drop-shadow-lg">860</span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center">
              <Share className="h-7 w-7 text-white drop-shadow-lg" />
            </div>
            <span className="text-white text-xs font-semibold drop-shadow-lg">195</span>
          </div>

          {/* Save */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center">
              <svg className="h-7 w-7 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
          </div>

          {/* More */}
          <div className="w-12 h-12 flex items-center justify-center">
            <MoreHorizontal className="h-6 w-6 text-white drop-shadow-lg" />
          </div>
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-8 w-8 border border-white/50">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" />
              <AvatarFallback>YB</AvatarFallback>
            </Avatar>
            <span className="text-white font-semibold text-sm">your_brand</span>
            <Button size="sm" variant="outline" className="h-7 px-4 text-xs border-white/50 text-white bg-transparent hover:bg-white/20">
              Follow
            </Button>
          </div>
          
          <div className="text-white text-sm leading-relaxed">
            {content || "Your caption will appear here... #trending"}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm">
        <div className="flex justify-around items-center py-3">
          <div className="flex flex-col items-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="text-white text-xs mt-1">Home</span>
          </div>
          <div className="flex flex-col items-center">
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <span className="text-white/60 text-xs mt-1">Search</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-white rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M7 4V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2h4a1 1 0 0 1 0 2h-1v14a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6H3a1 1 0 0 1 0-2h4zM6 6v14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6H6z"/>
            </svg>
            <span className="text-white/60 text-xs mt-1">Reels</span>
          </div>
          <div className="flex flex-col items-center">
            <Avatar className="h-6 w-6">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" />
              <AvatarFallback className="text-xs">YB</AvatarFallback>
            </Avatar>
            <span className="text-white/60 text-xs mt-1">Profile</span>
          </div>
        </div>
      </div>
    </div>
  );

  // TikTok Preview Component
  const TikTokPreview = () => (
    <div className="w-80 h-[600px] bg-black rounded-3xl overflow-hidden relative mx-auto shadow-2xl">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-6 py-3 text-white text-sm font-medium">
        <span>9:05</span>
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
          <svg className="w-4 h-4 ml-1" fill="white" viewBox="0 0 24 24">
            <path d="M2 17h20v2H2zm1.15-4.05L4 11l.85 1.95L6.8 13l-1.95.85L4 15.8l-.85-1.95L1.2 13l1.95-.85zM6.5 3L8 6.5 11.5 8 8 9.5 6.5 13 5 9.5 1.5 8 5 6.5 6.5 3zm5.5 6L13.5 12 17 13.5 13.5 15 12 18.5 10.5 15 7 13.5 10.5 12 12 9z"/>
          </svg>
          <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">76</span>
        </div>
      </div>

      {/* Video Content */}
      <div className="w-full h-full relative">
        {selectedVideo ? (
          <video
            src={selectedVideo}
            className="w-full h-full object-cover"
            muted
            loop
            autoPlay
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 flex items-center justify-center">
            <Play className="h-16 w-16 text-white/80" />
          </div>
        )}

        {/* Right Side Actions */}
        <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
          {/* Profile */}
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-white">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" />
              <AvatarFallback>RJ</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
              <Plus className="h-3 w-3 text-white" />
            </div>
          </div>

          {/* Like */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center">
              <svg className="h-8 w-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center">
              <svg className="h-8 w-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
          </div>

          {/* Bookmark */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center">
              <svg className="h-8 w-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 flex items-center justify-center">
              <svg className="h-8 w-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16,6 12,2 8,6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </div>
          </div>

          {/* Profile Avatar */}
          <Avatar className="h-10 w-10 border border-white/50">
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" />
            <AvatarFallback>RJ</AvatarFallback>
          </Avatar>
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-16 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">Rayzor Jung</span>
            </div>
            
            <div className="text-white text-sm leading-relaxed">
              {content || "#rayzorjung #fyp #mockingbird #nepaliversionbelike"}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-black">
        <div className="flex justify-around items-center py-2">
          <div className="flex flex-col items-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="text-white text-xs mt-1">Home</span>
          </div>
          <div className="flex flex-col items-center">
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span className="text-white/60 text-xs mt-1">Friends</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-black" />
            </div>
          </div>
          <div className="flex flex-col items-center relative">
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">7</span>
            </div>
            <span className="text-white/60 text-xs mt-1">Inbox</span>
          </div>
          <div className="flex flex-col items-center">
            <Avatar className="h-6 w-6">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" />
              <AvatarFallback className="text-xs">YB</AvatarFallback>
            </Avatar>
            <span className="text-white/60 text-xs mt-1">Profile</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
<AppShell>
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-border/20 fixed top-0 left-0 right-44 z-40 lg:left-64">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push("/make-post")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Play className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h1 className="font-semibold">Short Reel</h1>
                  <p className="text-sm text-gray-500">Vertical video content</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">Max 60s</Badge>
              <Button 
                size="sm" 
                className="gap-2"
                onClick={async () => {
                  if (!selectedTeamId && !editId) {
                    notifications.addNotification({
                      type: "error",
                      title: "No Team Selected",
                      message: "Please select a team first"
                    });
                    return;
                  }

                  if (!title.trim()) {
                    notifications.addNotification({
                      type: "error", 
                      title: "Title Required",
                      message: "Please enter a title for your post"
                    });
                    return;
                  }

                  setIsSaving(true);
                  try {
                    let videoKey: string | null = null;
                    
                    // Upload reel to S3 if file is selected
                    if (selectedFile) {
                      setIsUploading(true);
                      videoKey = await uploadReelToS3(selectedFile);
                      setIsUploading(false);
                    }

                    let response: Response;
                    if (editId) {
                      response = await fetch(`/api/content/${editId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title, content, platforms: selectedPlatforms, videoKey: videoKey ?? undefined })
                      });
                    } else {
                      response = await fetch('/api/posts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          type: 'reel',
                          title,
                          content,
                          teamId: selectedTeamId,
                          platforms: selectedPlatforms,
                          videoKey,
                          metadata: {}
                        })
                      });
                    }

                    const result = await response.json();
                    
                    if (response.ok) {
                      notifications.addNotification({
                        type: "success",
                        title: editId ? "Post Updated!" : "Post Saved!",
                        message: editId ? "Your changes have been saved" : `Reel post saved to ${selectedTeam?.name || 'team'}/reels/`
                      });
                      router.push('/dashboard');
                    } else {
                      throw new Error(result.message || 'Failed to save post');
                    }
                  } catch (error) {
                    notifications.addNotification({
                      type: "error",
                      title: "Save Failed",
                      message: error instanceof Error ? error.message : "Try again"
                    });
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving || isUploading || loadingExisting}
              >
                {loadingExisting || isUploading || isSaving ? (
                  <InlineSpinner size="sm" className="mr-2" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {loadingExisting ? 'Loading...' : isUploading ? 'Uploading...' : isSaving ? 'Saving...' : (editId ? 'Save Changes' : 'Save Post')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Main Content */}
          <div className="space-y-6">
            
            {/* Platform Selection */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">Publish to</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`px-3 py-2 rounded-md border text-sm font-medium transition-all ${
                        selectedPlatforms.includes(platform.id)
                          ? "bg-slate-800 border-slate-800 text-white"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {platform.name}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Video Upload */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Upload Video</CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedVideo ? (
                  <div
                    className={`border-2 border-dashed rounded-lg h-48 flex flex-col items-center justify-center transition-all ${
                      dragActive 
                        ? "border-green-400 bg-green-50" 
                        : "border-gray-300 hover:border-green-400"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-4" />
                    <p className="text-sm font-medium mb-2">Drop video here or click to upload</p>
                    <p className="text-xs text-gray-500 mb-4">MP4, MOV • Max 60 seconds</p>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="video-upload"
                    />
                    <Button asChild variant="outline">
                      <label htmlFor="video-upload" className="cursor-pointer">
                        Choose File
                      </label>
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <div className="relative w-40 h-56 bg-black rounded-xl overflow-hidden group">
                      <video
                        src={selectedVideo}
                        controls
                        className="w-full h-full object-cover"
                      />
                      <Button 
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          setSelectedVideo(null);
                          setSelectedFile(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
                        9:16
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Post Details */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Post Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter post title..."
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium mb-2 block">Caption</Label>
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Write a caption for your reel... Use formatting, #hashtags, @mentions, and links"
                    platforms={platforms}
                    selectedPlatforms={selectedPlatforms}
                  />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Preview Section - Much Wider */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Reel Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPlatforms.length > 0 ? (
                  <div className="flex flex-col items-center space-y-4">
                    {/* Platform badges */}
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                      {selectedPlatforms.map((platform) => (
                        <PlatformBadge key={platform} platform={platform} size="sm" />
                      ))}
                    </div>
                    
                    {/* Universal Reel Preview - iPhone 14 Pro Max aspect ratio */}
                    <div className="w-[390px] h-[844px] bg-black rounded-[40px] overflow-hidden relative shadow-2xl border-4 border-gray-800">
                      {/* Video Content */}
                      <div className="w-full h-full relative">
                        {selectedVideo ? (
                          <video
                            src={selectedVideo}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            autoPlay
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
                            <Play className="h-20 w-20 text-white/80" />
                          </div>
                        )}

                        {/* Right Side Actions */}
                        <div className="absolute right-4 bottom-24 flex flex-col items-center gap-4">
                          {/* Profile */}
                          <div className="relative">
                            <Avatar className="h-10 w-10 border-2 border-white">
                              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" />
                              <AvatarFallback>YB</AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                              <Plus className="h-3 w-3 text-white" />
                            </div>
                          </div>

                          {/* Like */}
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 flex items-center justify-center">
                              <Heart className="h-6 w-6 text-white drop-shadow-lg" />
                            </div>
                          </div>

                          {/* Comment */}
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 flex items-center justify-center">
                              <MessageCircle className="h-6 w-6 text-white drop-shadow-lg" />
                            </div>
                          </div>

                          {/* Share */}
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 flex items-center justify-center">
                              <Share className="h-6 w-6 text-white drop-shadow-lg" />
                            </div>
                          </div>

                          {/* Save */}
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 flex items-center justify-center">
                              <Bookmark className="h-6 w-6 text-white drop-shadow-lg" />
                            </div>
                          </div>
                        </div>

                        {/* Bottom Content */}
                        <div className="absolute bottom-0 left-0 right-20 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                          <div className="space-y-3 max-h-32 overflow-y-auto">
                            <div className="flex items-center gap-3">
                              <span className="text-white font-bold text-lg">@your_brand</span>
                              <Button size="sm" variant="outline" className="h-8 px-4 text-sm border-white/50 text-white bg-transparent hover:bg-white/20">
                                Follow
                              </Button>
                            </div>
                            
                            <div className="text-white text-sm leading-relaxed break-words line-clamp-3">
                              {formatContentWithColors(content)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Select platforms to see preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
      </AppShell>
  );
}

export default function MakePostReelsPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <InlineSpinner size="sm" />
        </div>
      </AppShell>
    }>
      <MakePostReelsContent />
    </Suspense>
  );
}