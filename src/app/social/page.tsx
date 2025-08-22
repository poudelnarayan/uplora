"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AppShell from "@/components/layout/AppShell";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { 
  Youtube, 
  Instagram, 
  Twitter, 
  Facebook, 
  Linkedin,
  Video,
  TrendingUp,
  Calendar,
  Users,
  Heart,
  MessageCircle,
  Share2,
  BarChart3,
  Clock,
  Plus,
  Upload,
  Image as ImageIcon,
  FileText,
  Play,
  Settings,
  Target,
  Zap,
  Eye,
  ThumbsUp,
  Send,
  CheckCircle,
  AlertCircle,
  Globe
} from "lucide-react";

const MotionDiv = motion.div as any;

export const dynamic = "force-dynamic";

interface AnalyticsData {
  totalFollowers: number;
  totalEngagement: number;
  postsThisMonth: number;
  avgEngagementRate: number;
  topPerformingPlatform: string;
  recentGrowth: number;
}

interface RecentActivity {
  id: string;
  type: "post" | "engagement" | "follower";
  platform: string;
  content: string;
  timestamp: Date;
  metrics?: {
    likes?: number;
    comments?: number;
    shares?: number;
  };
}

interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  scheduledFor: Date;
  status: "scheduled" | "published" | "failed";
  contentType: "text" | "image" | "video" | "reel";
}

export default function SocialDashboardPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "upload" | "calendar" | "analytics">("dashboard");
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>(["youtube"]);
  const [uploadType, setUploadType] = useState<"text" | "image" | "video" | "reel">("text");
  const [uploadContent, setUploadContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Mock data - replace with real API calls
  const [analytics] = useState<AnalyticsData>({
    totalFollowers: 125400,
    totalEngagement: 8750,
    postsThisMonth: 24,
    avgEngagementRate: 4.2,
    topPerformingPlatform: "YouTube",
    recentGrowth: 12.5
  });

  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: "1",
      type: "post",
      platform: "YouTube",
      content: "New tutorial video published",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      metrics: { likes: 245, comments: 18, shares: 12 }
    },
    {
      id: "2", 
      type: "engagement",
      platform: "Instagram",
      content: "Story received 1.2k views",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      id: "3",
      type: "follower",
      platform: "TikTok",
      content: "50 new followers today",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
    }
  ]);

  const [scheduledPosts] = useState<ScheduledPost[]>([
    {
      id: "1",
      content: "Behind the scenes of our latest project...",
      platforms: ["Instagram", "Facebook"],
      scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000),
      status: "scheduled",
      contentType: "image"
    },
    {
      id: "2",
      content: "Weekly tips and tricks video",
      platforms: ["YouTube", "TikTok"],
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: "scheduled", 
      contentType: "video"
    }
  ]);

  const platforms = [
    { 
      id: "youtube", 
      name: "YouTube", 
      icon: Youtube, 
      color: "#FF0000", 
      connected: true,
      followers: "45.2K",
      engagement: "4.8%"
    },
    { 
      id: "instagram", 
      name: "Instagram", 
      icon: Instagram, 
      color: "#E4405F", 
      connected: false,
      followers: "32.1K",
      engagement: "6.2%"
    },
    { 
      id: "tiktok", 
      name: "TikTok", 
      icon: Video, 
      color: "#000000", 
      connected: false,
      followers: "28.7K",
      engagement: "8.1%"
    },
    { 
      id: "twitter", 
      name: "X / Twitter", 
      icon: Twitter, 
      color: "#1DA1F2", 
      connected: false,
      followers: "19.5K",
      engagement: "3.4%"
    },
    { 
      id: "facebook", 
      name: "Facebook", 
      icon: Facebook, 
      color: "#1877F2", 
      connected: false,
      followers: "15.8K",
      engagement: "2.9%"
    },
    { 
      id: "linkedin", 
      name: "LinkedIn", 
      icon: Linkedin, 
      color: "#0A66C2", 
      connected: false,
      followers: "8.3K",
      engagement: "5.7%"
    }
  ];

  const handleUpload = async () => {
    if (!uploadContent.trim() || selectedPlatforms.length === 0) return;
    
    setIsUploading(true);
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset form
      setUploadContent("");
      setSelectedPlatforms([]);
      setScheduleDate("");
      
      // Show success message
      console.log("Content uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg p-6"
          style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#00ADB5', color: 'white' }}>
              +{analytics.recentGrowth}%
            </span>
          </div>
          <div className="text-2xl font-bold" style={{ color: '#222831' }}>
            {analytics.totalFollowers.toLocaleString()}
          </div>
          <div className="text-sm" style={{ color: '#393E46' }}>Total Followers</div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg p-6"
          style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#393E46' }}>
              <Heart className="w-5 h-5 text-white" />
            </div>
            <TrendingUp className="w-4 h-4" style={{ color: '#00ADB5' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: '#222831' }}>
            {analytics.totalEngagement.toLocaleString()}
          </div>
          <div className="text-sm" style={{ color: '#393E46' }}>Total Engagement</div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg p-6"
          style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#222831' }}>
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs" style={{ color: '#00ADB5' }}>{analytics.avgEngagementRate}%</span>
          </div>
          <div className="text-2xl font-bold" style={{ color: '#222831' }}>
            {analytics.postsThisMonth}
          </div>
          <div className="text-sm" style={{ color: '#393E46' }}>Posts This Month</div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg p-6"
          style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
              <Target className="w-5 h-5 text-white" />
            </div>
            <CheckCircle className="w-4 h-4" style={{ color: '#00ADB5' }} />
          </div>
          <div className="text-lg font-bold" style={{ color: '#222831' }}>
            {analytics.topPerformingPlatform}
          </div>
          <div className="text-sm" style={{ color: '#393E46' }}>Top Platform</div>
        </MotionDiv>
      </div>

      {/* Platform Connections */}
      <div className="rounded-lg p-6" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-3" style={{ color: '#222831' }}>
          <Globe className="w-6 h-6" style={{ color: '#00ADB5' }} />
          Connected Platforms
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform) => {
            const IconComponent = platform.icon;
            return (
              <div
                key={platform.id}
                className="rounded-lg p-4 transition-all hover:scale-105"
                style={{ 
                  backgroundColor: platform.connected ? 'white' : '#F5F5F5',
                  border: `2px solid ${platform.connected ? '#00ADB5' : '#393E46'}`
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: platform.color }}
                    >
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: '#222831' }}>{platform.name}</div>
                      <div className="text-sm" style={{ color: '#393E46' }}>
                        {platform.followers} followers
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium" style={{ color: platform.connected ? '#00ADB5' : '#393E46' }}>
                      {platform.engagement}
                    </div>
                    <div className="text-xs" style={{ color: '#393E46' }}>engagement</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    platform.connected 
                      ? 'text-white' 
                      : 'text-white'
                  }`}
                  style={{
                    backgroundColor: platform.connected ? '#00ADB5' : '#393E46'
                  }}>
                    {platform.connected ? "Connected" : "Coming Soon"}
                  </span>
                  {platform.connected && (
                    <button className="text-xs px-2 py-1 rounded" style={{ color: '#393E46' }}>
                      <Settings className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity & Scheduled Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="rounded-lg p-6" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#222831' }}>
            <Clock className="w-5 h-5" style={{ color: '#00ADB5' }} />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'white' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
                  {activity.type === "post" && <Send className="w-4 h-4 text-white" />}
                  {activity.type === "engagement" && <Heart className="w-4 h-4 text-white" />}
                  {activity.type === "follower" && <Users className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm" style={{ color: '#222831' }}>{activity.platform}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#393E46', color: 'white' }}>
                      {activity.type}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: '#393E46' }}>{activity.content}</p>
                  <div className="text-xs mt-1" style={{ color: '#393E46' }}>
                    {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {activity.metrics && (
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs flex items-center gap-1" style={{ color: '#393E46' }}>
                        <ThumbsUp className="w-3 h-3" /> {activity.metrics.likes}
                      </span>
                      <span className="text-xs flex items-center gap-1" style={{ color: '#393E46' }}>
                        <MessageCircle className="w-3 h-3" /> {activity.metrics.comments}
                      </span>
                      <span className="text-xs flex items-center gap-1" style={{ color: '#393E46' }}>
                        <Share2 className="w-3 h-3" /> {activity.metrics.shares}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled Posts */}
        <div className="rounded-lg p-6" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#222831' }}>
            <Calendar className="w-5 h-5" style={{ color: '#00ADB5' }} />
            Scheduled Posts
          </h3>
          <div className="space-y-3">
            {scheduledPosts.map((post) => (
              <div key={post.id} className="p-3 rounded-lg" style={{ backgroundColor: 'white', border: '1px solid #393E46' }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: '#222831' }}>
                      {post.content.length > 50 ? post.content.substring(0, 50) + "..." : post.content}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {post.platforms.map((platform) => (
                        <span key={platform} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#393E46', color: 'white' }}>
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs" style={{ color: '#393E46' }}>
                      {post.scheduledFor.toLocaleDateString()}
                    </div>
                    <div className="text-xs" style={{ color: '#393E46' }}>
                      {post.scheduledFor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    post.status === "scheduled" ? 'text-white' : 
                    post.status === "published" ? 'text-white' : 'text-white'
                  }`}
                  style={{
                    backgroundColor: post.status === "scheduled" ? '#00ADB5' :
                                   post.status === "published" ? '#4CAF50' : '#F44336'
                  }}>
                    {post.status}
                  </span>
                  <div className="flex items-center gap-1">
                    {post.contentType === "text" && <FileText className="w-3 h-3" style={{ color: '#393E46' }} />}
                    {post.contentType === "image" && <ImageIcon className="w-3 h-3" style={{ color: '#393E46' }} />}
                    {post.contentType === "video" && <Video className="w-3 h-3" style={{ color: '#393E46' }} />}
                    {post.contentType === "reel" && <Play className="w-3 h-3" style={{ color: '#393E46' }} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg p-6" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#222831' }}>
          <Zap className="w-5 h-5" style={{ color: '#00ADB5' }} />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: FileText, label: "Create Post", action: () => setActiveTab("upload") },
            { icon: Calendar, label: "Schedule Content", action: () => setActiveTab("calendar") },
            { icon: BarChart3, label: "View Analytics", action: () => setActiveTab("analytics") },
            { icon: Settings, label: "Manage Accounts", action: () => {} }
          ].map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="p-4 rounded-lg transition-all hover:scale-105 text-center"
              style={{ backgroundColor: 'white', border: '1px solid #393E46' }}
            >
              <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
                <action.icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm font-medium" style={{ color: '#222831' }}>{action.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUpload = () => (
    <div className="space-y-6">
      {/* Content Type Selector */}
      <div className="rounded-lg p-6" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-3" style={{ color: '#222831' }}>
          <Upload className="w-6 h-6" style={{ color: '#00ADB5' }} />
          Create Content
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { type: "text", icon: FileText, label: "Text Post" },
            { type: "image", icon: ImageIcon, label: "Image Post" },
            { type: "video", icon: Video, label: "Video" },
            { type: "reel", icon: Play, label: "Reel/Short" }
          ].map((contentType) => (
            <button
              key={contentType.type}
              onClick={() => setUploadType(contentType.type as any)}
              className={`p-4 rounded-lg transition-all hover:scale-105 ${
                uploadType === contentType.type ? 'shadow-lg' : ''
              }`}
              style={{
                backgroundColor: uploadType === contentType.type ? '#00ADB5' : 'white',
                color: uploadType === contentType.type ? 'white' : '#222831',
                border: `2px solid ${uploadType === contentType.type ? '#00ADB5' : '#393E46'}`
              }}
            >
              <contentType.icon className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">{contentType.label}</div>
            </button>
          ))}
        </div>

        {/* Content Input */}
        <div className="space-y-4">
          {uploadType === "text" && (
            <textarea
              value={uploadContent}
              onChange={(e) => setUploadContent(e.target.value)}
              placeholder="What's on your mind? Share your thoughts with your audience..."
              className="w-full h-32 p-4 rounded-lg border resize-none"
              style={{ backgroundColor: 'white', borderColor: '#393E46', color: '#222831' }}
            />
          )}

          {uploadType === "image" && (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center transition-all hover:border-solid"
                style={{ borderColor: '#393E46', backgroundColor: 'white' }}
              >
                <ImageIcon className="w-12 h-12 mx-auto mb-4" style={{ color: '#393E46' }} />
                <p className="font-medium mb-2" style={{ color: '#222831' }}>Drop images here or click to browse</p>
                <p className="text-sm" style={{ color: '#393E46' }}>Supports JPG, PNG, GIF up to 10MB</p>
              </div>
              <textarea
                value={uploadContent}
                onChange={(e) => setUploadContent(e.target.value)}
                placeholder="Add a caption for your image..."
                className="w-full h-24 p-4 rounded-lg border resize-none"
                style={{ backgroundColor: 'white', borderColor: '#393E46', color: '#222831' }}
              />
            </div>
          )}

          {(uploadType === "video" || uploadType === "reel") && (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center transition-all hover:border-solid"
                style={{ borderColor: '#393E46', backgroundColor: 'white' }}
              >
                <Video className="w-12 h-12 mx-auto mb-4" style={{ color: '#393E46' }} />
                <p className="font-medium mb-2" style={{ color: '#222831' }}>
                  Drop {uploadType === "reel" ? "short videos" : "videos"} here or click to browse
                </p>
                <p className="text-sm" style={{ color: '#393E46' }}>
                  {uploadType === "reel" ? "15-60 seconds, MP4 format" : "MP4, MOV, AVI up to 2GB"}
                </p>
              </div>
              <textarea
                value={uploadContent}
                onChange={(e) => setUploadContent(e.target.value)}
                placeholder={`Add a ${uploadType === "reel" ? "catchy description" : "description"} for your ${uploadType}...`}
                className="w-full h-24 p-4 rounded-lg border resize-none"
                style={{ backgroundColor: 'white', borderColor: '#393E46', color: '#222831' }}
              />
            </div>
          )}
        </div>

        {/* Platform Selection */}
        <div className="space-y-3">
          <h4 className="font-semibold" style={{ color: '#222831' }}>Select Platforms</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {platforms.filter(p => p.connected).map((platform) => {
              const IconComponent = platform.icon;
              const isSelected = selectedPlatforms.includes(platform.id);
              return (
                <button
                  key={platform.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedPlatforms(prev => prev.filter(p => p !== platform.id));
                    } else {
                      setSelectedPlatforms(prev => [...prev, platform.id]);
                    }
                  }}
                  className={`p-3 rounded-lg transition-all hover:scale-105 ${
                    isSelected ? 'shadow-lg' : ''
                  }`}
                  style={{
                    backgroundColor: isSelected ? '#00ADB5' : 'white',
                    color: isSelected ? 'white' : '#222831',
                    border: `2px solid ${isSelected ? '#00ADB5' : '#393E46'}`
                  }}
                >
                  <IconComponent className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-xs font-medium">{platform.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scheduling */}
        <div className="space-y-3">
          <h4 className="font-semibold" style={{ color: '#222831' }}>Schedule (Optional)</h4>
          <input
            type="datetime-local"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="w-full p-3 rounded-lg border"
            style={{ backgroundColor: 'white', borderColor: '#393E46', color: '#222831' }}
          />
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={isUploading || !uploadContent.trim() || selectedPlatforms.length === 0}
          className="w-full p-4 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#00ADB5', color: 'white' }}
        >
          {isUploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {scheduleDate ? "Scheduling..." : "Publishing..."}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              {scheduleDate ? <Calendar className="w-5 h-5" /> : <Send className="w-5 h-5" />}
              {scheduleDate ? "Schedule Post" : "Publish Now"}
            </div>
          )}
        </button>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="rounded-lg p-6" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-3" style={{ color: '#222831' }}>
          <BarChart3 className="w-6 h-6" style={{ color: '#00ADB5' }} />
          Performance Analytics
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Engagement Chart Placeholder */}
          <div className="md:col-span-2 p-6 rounded-lg" style={{ backgroundColor: 'white', border: '1px solid #393E46' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#222831' }}>Engagement Over Time</h3>
            <div className="h-48 flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2" style={{ color: '#393E46' }} />
                <p className="text-sm" style={{ color: '#393E46' }}>Chart visualization coming soon</p>
              </div>
            </div>
          </div>

          {/* Top Content */}
          <div className="p-6 rounded-lg" style={{ backgroundColor: 'white', border: '1px solid #393E46' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#222831' }}>Top Performing</h3>
            <div className="space-y-3">
              {[
                { title: "Tutorial: Getting Started", engagement: "2.4K", platform: "YouTube" },
                { title: "Behind the Scenes", engagement: "1.8K", platform: "Instagram" },
                { title: "Quick Tips", engagement: "1.2K", platform: "TikTok" }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#222831' }}>{item.title}</p>
                    <p className="text-xs" style={{ color: '#393E46' }}>{item.platform}</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#00ADB5' }}>{item.engagement}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.filter(p => p.connected).map((platform) => {
          const IconComponent = platform.icon;
          return (
            <div key={platform.id} className="rounded-lg p-6" style={{ backgroundColor: 'white', border: '1px solid #393E46' }}>
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: platform.color }}
                >
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold" style={{ color: '#222831' }}>{platform.name}</div>
                  <div className="text-sm" style={{ color: '#393E46' }}>{platform.followers} followers</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: '#393E46' }}>Engagement Rate</span>
                  <span className="text-sm font-semibold" style={{ color: '#00ADB5' }}>{platform.engagement}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: '#393E46' }}>Posts This Week</span>
                  <span className="text-sm font-semibold" style={{ color: '#222831' }}>
                    {Math.floor(Math.random() * 10) + 1}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: '#393E46' }}>Avg. Reach</span>
                  <span className="text-sm font-semibold" style={{ color: '#222831' }}>
                    {(Math.random() * 50 + 10).toFixed(1)}K
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <SignedIn>
        <AppShell>
          <NextSeoNoSSR title="Social Media Dashboard" noindex nofollow />
          
          <div className="h-[calc(100vh-8rem)] overflow-hidden">
            <div className="h-full overflow-y-auto px-4 lg:px-0">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold" style={{ color: '#222831' }}>Social Media Dashboard</h1>
                <p className="text-lg" style={{ color: '#393E46' }}>
                  Manage all your social media accounts from one place
                </p>
              </div>

              {/* Tab Navigation */}
              <div className="mb-6">
                <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: '#393E46' }}>
                  {[
                    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
                    { id: "upload", label: "Create Content", icon: Upload },
                    { id: "calendar", label: "Calendar", icon: Calendar },
                    { id: "analytics", label: "Analytics", icon: TrendingUp }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all ${
                        activeTab === tab.id ? 'shadow-lg' : 'hover:bg-opacity-80'
                      }`}
                      style={{
                        backgroundColor: activeTab === tab.id ? '#00ADB5' : 'transparent',
                        color: activeTab === tab.id ? 'white' : '#EEEEEE'
                      }}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <MotionDiv
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === "dashboard" && renderDashboard()}
                {activeTab === "upload" && renderUpload()}
                {activeTab === "calendar" && (
                  <div className="rounded-lg p-12 text-center" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
                    <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: '#393E46' }} />
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#222831' }}>Content Calendar</h3>
                    <p style={{ color: '#393E46' }}>Advanced scheduling and calendar view coming soon</p>
                  </div>
                )}
                {activeTab === "analytics" && renderAnalytics()}
              </MotionDiv>
            </div>
          </div>
        </AppShell>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/social" />
      </SignedOut>
    </>
  );
}