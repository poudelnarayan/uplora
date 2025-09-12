'use client';

import { useState, useCallback, useEffect, useRef } from "react";
import * as React from "react";
import { motion } from "framer-motion";
import { 
  Video, 
  ArrowLeft, 
  Upload, 
  Send, 
  Globe, 
  Lock, 
  Link,
  Save,
  Image as ImageIcon,
  X,
  Youtube,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/components/ui/Notification";
import { InlineSpinner } from "@/components/ui/loading-spinner";

interface ExpandableDescriptionProps {
  description: string;
  formatContent: (text: string) => React.ReactNode;
}

const ExpandableDescription = ({ description, formatContent }: ExpandableDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSeeMore, setShowSeeMore] = useState(false);
  
  // Check if description is long enough to need "See more"
  React.useEffect(() => {
    setShowSeeMore(description.length > 100);
  }, [description]);
  
  const truncatedDescription = description.slice(0, 100);
  
  return (
    <div className="p-3 bg-gray-800 rounded-lg">
      <div className={`text-xs leading-relaxed whitespace-pre-wrap break-words text-gray-300 ${
        isExpanded ? 'max-h-40 overflow-y-auto' : 'max-h-20 overflow-hidden'
      }`}>
        {formatContent(isExpanded ? description : (showSeeMore ? truncatedDescription : description))}
        {showSeeMore && !isExpanded && (
          <button 
            onClick={() => setIsExpanded(true)}
            className="text-gray-400 hover:text-white ml-1 font-medium"
          >
            ...See more
          </button>
        )}
        {isExpanded && showSeeMore && (
          <button 
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-white ml-1 font-medium block mt-1"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  );
};

const MakePostVideos = () => {
  const router = useRouter();
  const notifications = useNotifications();
  const [dragActive, setDragActive] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const fileRef = useRef<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [category, setCategory] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [isConnected, setIsConnected] = useState(false);
  const [channelTitle, setChannelTitle] = useState<string | null>(null);
  const [s3Key, setS3Key] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savedThumbnailKey, setSavedThumbnailKey] = useState<string | null>(null);

  const categories = [
    { value: "education", label: "Education" },
    { value: "entertainment", label: "Entertainment" },
    { value: "gaming", label: "Gaming" },
    { value: "music", label: "Music" },
    { value: "news", label: "News & Politics" },
    { value: "science", label: "Science & Technology" },
    { value: "sports", label: "Sports" },
    { value: "travel", label: "Travel & Events" }
  ];

  const privacyOptions = [
    { value: "public", label: "Public", icon: Globe },
    { value: "unlisted", label: "Unlisted", icon: Link },
    { value: "private", label: "Private", icon: Lock }
  ];

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
      fileRef.current = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedVideo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      void uploadToS3(file);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedThumbnail(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      // Remove last tag if input is empty and backspace is pressed
      setTags(prev => prev.slice(0, -1));
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Check if user typed a comma
    if (value.includes(',')) {
      const parts = value.split(',');
      const newTag = parts[0].trim();
      
      if (newTag && !tags.includes(newTag) && tags.length < 15) {
        setTags(prev => [...prev, newTag]);
      }
      
      // Set remaining text after comma
      setTagInput(parts.slice(1).join(',').trim());
    } else {
      setTagInput(value);
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 15) {
      setTags(prev => [...prev, trimmedTag]);
      setTagInput("");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/youtube/status', { cache: 'no-store' });
        const data = await res.json();
        if (data?.isConnected) {
          setIsConnected(true);
          setChannelTitle(data.channelTitle || null);
        }
      } catch {}
    })();
  }, []);

  const uploadToS3 = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(1);
      const initResp = await fetch('/api/s3/multipart/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type || 'video/mp4' })
      });
      if (!initResp.ok) throw new Error('Failed to init upload');
      const { key, uploadId, partSize = 16 * 1024 * 1024 } = await initResp.json();
      const totalParts = Math.ceil(file.size / partSize);
      const uploaded: Array<{ ETag: string; PartNumber: number }> = [];
      let completedBytes = 0;
      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        const start = (partNumber - 1) * partSize;
        const end = Math.min(start + partSize, file.size);
        const chunk = file.slice(start, end);
        const sign = await fetch('/api/s3/multipart/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, uploadId, partNumber })
        });
        if (!sign.ok) throw new Error('Failed to sign part');
        const { url } = await sign.json();
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', url);
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) {
              const loadedTotal = completedBytes + evt.loaded;
              const pct = Math.min(99, Math.round((loadedTotal / file.size) * 100));
              setUploadProgress(pct);
            }
          };
          xhr.onerror = () => reject(new Error('Upload error'));
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              completedBytes += chunk.size;
              const etag = (xhr.getResponseHeader('ETag') || '').replace(/\"/g, '').replace(/"/g, '');
              uploaded.push({ ETag: etag, PartNumber: partNumber });
              resolve();
            } else reject(new Error('Upload failed'));
          };
          xhr.send(chunk);
        });
      }
      const complete = await fetch('/api/s3/multipart/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, uploadId, parts: uploaded, originalFilename: file.name, contentType: file.type || 'video/mp4', sizeBytes: file.size })
      });
      if (!complete.ok) throw new Error('Failed to complete upload');
      const completeJson = await complete.json().catch(() => ({}));
      setUploadProgress(100);
      setS3Key(key);
      if (completeJson?.videoId) setVideoId(completeJson.videoId);
      notifications.addNotification({ type: 'success', title: 'Uploaded to cloud', message: 'Video is ready to publish' });
    } catch (e) {
      notifications.addNotification({ type: 'error', title: 'Upload failed', message: e instanceof Error ? e.message : 'Try again' });
    } finally {
      setIsUploading(false);
    }
  };

  const persistVideoMeta = async () => {
    if (!videoId) {
      notifications.addNotification({ type: 'warning', title: 'No video yet', message: 'Upload a video first' });
      return;
    }
    try {
      setSavingMeta(true);
      let thumbnailKey: string | undefined = undefined;
      if (thumbFile) {
        const presign = await fetch('/api/s3/presign-thumbnail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: thumbFile.name, contentType: thumbFile.type, videoId })
        });
        if (!presign.ok) throw new Error('Failed to prepare thumbnail upload');
        const { putUrl, key } = await presign.json();
        await fetch(putUrl, { method: 'PUT', headers: { 'Content-Type': thumbFile.type }, body: thumbFile });
        thumbnailKey = key;
        setSavedThumbnailKey(key);
      }
      const patch = await fetch(`/api/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          visibility: privacy,
          madeForKids: false,
          thumbnailKey: thumbnailKey !== undefined ? thumbnailKey : undefined
        })
      });
      if (!patch.ok) {
        const err = await patch.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to save');
      }
      notifications.addNotification({ type: 'success', title: 'Saved', message: 'Details updated' });
    } catch (e) {
      notifications.addNotification({ type: 'error', title: 'Save failed', message: e instanceof Error ? e.message : 'Try again' });
    } finally {
      setSavingMeta(false);
    }
  };

  const publishToYouTube = async () => {
    if (!isConnected) {
      notifications.addNotification({ type: 'warning', title: 'Connect YouTube', message: 'Please connect your YouTube in Social first' });
      router.push('/social');
      return;
    }
    if (!s3Key) {
      const f = fileRef.current;
      if (f) {
        await uploadToS3(f);
      } else {
        notifications.addNotification({ type: 'error', title: 'No video', message: 'Select a video to upload' });
        return;
      }
    }
    if (!s3Key) return;
    try {
      setIsPublishing(true);
      const resp = await fetch('/api/youtube/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: s3Key, title: title || 'Untitled', description, privacyStatus: privacy, madeForKids: false })
      });
      const js = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(js.error || 'Publish failed');
      notifications.addNotification({ type: 'success', title: 'Published to YouTube', message: 'Your video has been submitted' });
    } catch (e) {
      notifications.addNotification({ type: 'error', title: 'Publish failed', message: e instanceof Error ? e.message : 'Try again' });
    } finally {
      setIsPublishing(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const formatContentWithColors = (text: string) => {
    if (!text) return <span className="text-gray-400">Your video description...</span>;
    
    return text.split(/(\s+)/).map((word, index) => {
      if (word.startsWith('#')) {
        return <span key={index} className="text-blue-600 font-medium">{word}</span>;
      } else if (word.startsWith('@')) {
        return <span key={index} className="text-purple-600 font-medium">{word}</span>;
      } else if (word.match(/https?:\/\/[^\s]+/) || word.match(/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/)) {
        return <span key={index} className="text-green-600 font-medium underline">{word}</span>;
      } else if (word.startsWith('**') && word.endsWith('**')) {
        return <span key={index} className="font-bold">{word.slice(2, -2)}</span>;
      } else if (word.startsWith('*') && word.endsWith('*')) {
        return <span key={index} className="italic">{word.slice(1, -1)}</span>;
      } else if (word.match(/\^ (.*?) \^/)) {
        const content = word.match(/\^ (.*?) \^/)?.[1] || '';
        return <span key={index} className="text-xl font-bold text-gray-900">{content}</span>;
      } else if (word.match(/\^\^ (.*?) \^\^/)) {
        const content = word.match(/\^\^ (.*?) \^\^/)?.[1] || '';
        return <span key={index} className="text-lg font-semibold text-gray-800">{content}</span>;
      }
      return <span key={index}>{word}</span>;
    });
  };

  return (

    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-border/20 fixed top-0 left-0 right-44 z-40 lg:left-64">
        <div className="max-w-5xl mx-auto px-6 py-4">
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
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <Youtube className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h1 className="font-semibold">YouTube Video</h1>
                  <p className="text-sm text-gray-500">Long-form content</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">{uploadProgress > 0 ? `${uploadProgress}%` : 'Max 4GB'}</Badge>
              {!isConnected ? (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push('/social')}>
                  Connect YouTube
                </Button>
              ) : (
                <Badge variant="outline" className="text-xs">{channelTitle || 'YouTube Connected'}</Badge>
              )}
              <Button variant="outline" size="sm" className="gap-2" onClick={persistVideoMeta} disabled={savingMeta || !videoId}>
                {savingMeta ? (
                  <InlineSpinner size="sm" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {savingMeta ? 'Saving…' : 'Save Draft'}
              </Button>
              <Button size="sm" className="gap-2" disabled={isPublishing || isUploading} onClick={async () => { await persistVideoMeta(); await publishToYouTube(); }}>
                {isPublishing || isUploading ? (
                  <InlineSpinner size="sm" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isPublishing ? 'Publishing...' : 'Publish to YouTube'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 pt-24">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
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
                        ? "border-red-400 bg-red-50" 
                        : "border-gray-300 hover:border-red-400"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-4" />
                    <p className="text-sm font-medium mb-2">Drop video here or click to upload</p>
                    <p className="text-xs text-gray-500 mb-4">MP4, MOV, AVI • Maximum 4GB</p>
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
                  <div className="bg-black rounded-lg overflow-hidden group relative">
                    <video
                      src={selectedVideo}
                      controls
                      className="w-full h-40 object-contain"
                    />
                    <Button 
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setSelectedVideo(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Video Details */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Video Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter video title"
                    maxLength={100}
                    className="border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                  <p className="text-xs text-gray-500 text-right">{title.length}/100</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Description</Label>
                  
                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    placeholder="Describe your video... Use formatting, #hashtags, @mentions, and links"
                    platforms={[{ id: "YouTube", name: "YouTube", limit: 5000 }]}
                    selectedPlatforms={["YouTube"]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Privacy</Label>
                    <Select value={privacy} onValueChange={setPrivacy}>
                      <SelectTrigger className="border-gray-200 focus:border-red-500 focus:ring-1 focus:ring-red-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {privacyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="h-4 w-4" />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Tags</Label>
                  <div className="space-y-2">
                    <div className="min-h-[40px] p-2 border border-gray-200 rounded-md focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="hover:bg-blue-200 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <Input
                        value={tagInput}
                        onChange={handleTagInputChange}
                        onKeyDown={handleTagInputKeyDown}
                        onBlur={addTag}
                        placeholder={tags.length === 0 ? "Add tags (press Enter or comma to add)" : "Add another tag..."}
                        className="border-0 px-2 py-1 h-8 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {tags.length}/15 tags • Press Enter or comma to add tags
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Thumbnail */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Thumbnail</CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedThumbnail ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-all">
                    <ImageIcon className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm font-medium mb-2">Upload Custom Thumbnail</p>
                    <p className="text-xs text-gray-500 mb-4">1280x720 recommended</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="hidden"
                      id="thumbnail-upload"
                    />
                    <Button asChild variant="outline" size="sm">
                      <label htmlFor="thumbnail-upload" className="cursor-pointer">
                        Choose Image
                      </label>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden group">
                      <img
                        src={selectedThumbnail}
                        alt="Thumbnail"
                        className="w-full h-24 object-cover"
                      />
                      <Button 
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedThumbnail(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Settings & Scheduling */}
            <Card className="shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Comments</Label>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Notify subscribers</Label>
                    <Switch defaultChecked />
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* YouTube Preview */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm sticky top-24 w-full max-w-none">
              <CardContent className="p-0">
                {/* iPhone 14 Pro Max Preview */}
                <div className="w-[390px] h-[844px] bg-white rounded-[40px] overflow-hidden relative shadow-2xl border-4 border-gray-800">
                  {/* YouTube App Content */}
                  <div className="pt-4 pb-8 px-4 h-full overflow-y-auto bg-black">
                    {/* Video Player */}
                    <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video mb-4">
                      {selectedThumbnail ? (
                        <img src={selectedThumbnail} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                          <Video className="h-12 w-12 text-white/50" />
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                        10:32
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                          <Video className="h-8 w-8 text-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Video Info */}
                    <div className="space-y-3">
                      {tags.length > 0 && tags.slice(0, 3).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 bg-gray-700 text-blue-400 text-xs rounded-md hover:bg-gray-600 cursor-pointer"
                            >
                              #{tag}
                            </span>
                          ))}
                          {tags.length > 3 && (
                            <span className="inline-block px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded-md">
                              +{tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                      
                      <h4 className="font-medium text-base leading-tight text-white line-clamp-2 break-words">
                        {title || "Your video title will appear here..."}
                      </h4>
                      
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src="/api/placeholder/36/36" />
                          <AvatarFallback className="bg-red-100 text-red-600 text-sm">YC</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">Your Channel</p>
                          <p className="text-xs text-gray-400">125K subscribers</p>
                        </div>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-full text-sm font-medium">
                          Subscribe
                        </Button>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        No views • Just uploaded
                      </div>

                      {description && (
                        <ExpandableDescription description={description} formatContent={formatContentWithColors} />
                      )}

                      <div className="flex items-center gap-2">
                        {privacyOptions.find(p => p.value === privacy)?.icon && (
                          <div className="flex items-center gap-2">
                            {(() => {
                              const PrivacyIcon = privacyOptions.find(p => p.value === privacy)?.icon;
                              return PrivacyIcon ? <PrivacyIcon className="h-3 w-3 text-gray-400" /> : null;
                            })()}
                            <Badge variant="outline" className="text-xs bg-gray-800 text-gray-300 border-gray-600">
                              {privacyOptions.find(p => p.value === privacy)?.label}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
  );
};

export default MakePostVideos;