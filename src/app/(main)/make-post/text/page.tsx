"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { 
  Type, 
  ArrowLeft, 
  Send, 
  Save,
  Eye,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Share,
  Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlatformBadge from  "@/components/ui/PlatformBadge";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { useTeam } from "@/context/TeamContext";
import { useNotifications } from "@/components/ui/Notification";
import { InlineSpinner } from "@/components/ui/loading-spinner";
import AppShell from "@/components/layout/AppLayout";
import { useSearchParams } from "next/navigation";

function MakePostTextContent() {
  const router = useRouter();
  const { selectedTeamId, selectedTeam } = useTeam();
  const notifications = useNotifications();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram", "X (Twitter)"]);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState<boolean>(!!editId);

  const platforms = [
    { id: "Instagram", name: "Instagram", limit: 2200 },
    { id: "X (Twitter)", name: "X (Twitter)", limit: 280 },
    { id: "Facebook", name: "Facebook", limit: 63206 },
    { id: "LinkedIn", name: "LinkedIn", limit: 3000 }
  ];

  // Load existing post for edit
  useEffect(() => {
    const load = async () => {
      if (!editId) return;
      try {
        const res = await fetch(`/api/content/${editId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load post');
        setContent(data.content || "");
        if (Array.isArray(data.platforms)) setSelectedPlatforms(data.platforms);
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

  const formatContentWithColors = (text: string) => {
    if (!text) return <span className="text-muted-foreground">Start writing your post...</span>;
    
    return text.split(/(\s+)/).map((word, index) => {
      if (word.startsWith('#')) {
        return <span key={index} className="text-blue-600 font-medium">{word}</span>;
      } else if (word.startsWith('@')) {
        return <span key={index} className="text-purple-600 font-medium">{word}</span>;
      } else if (word.match(/https?:\/\/[^\s]+/) || word.match(/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/)) {
        return <span key={index} className="text-green-600 font-medium underline">{word}</span>;
      } else if (word.startsWith('**') && word.endsWith('**')) {
        const content = word.slice(2, -2);
        return content ? <span key={index} className="font-bold">{content}</span> : <span key={index}>{word}</span>;
      } else if (word.startsWith('*') && word.endsWith('*')) {
        const content = word.slice(1, -1);
        return content ? <span key={index} className="italic">{content}</span> : <span key={index}>{word}</span>;
      } else if (word.startsWith('^') && word.endsWith('^') && !word.startsWith('^^')) {
        const content = word.slice(1, -1);
        return content ? <span key={index} className="text-xl font-bold text-gray-900">{content}</span> : <span key={index}>{word}</span>;
      } else if (word.startsWith('^^') && word.endsWith('^^')) {
        const content = word.slice(2, -2);
        return content ? <span key={index} className="text-lg font-semibold text-gray-800">{content}</span> : <span key={index}>{word}</span>;
      }
      return <span key={index}>{word}</span>;
    });
  };

  return (
<AppShell>
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
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Type className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h1 className="font-semibold">Text Post</h1>
                  <p className="text-sm text-gray-500">Create text content</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
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

                  if (!content.trim()) {
                    notifications.addNotification({
                      type: "error", 
                      title: "Content Required",
                      message: "Please write some content for your post"
                    });
                    return;
                  }

                  setIsSaving(true);
                  try {
                    let response: Response;
                    if (editId) {
                      response = await fetch(`/api/content/${editId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content, platforms: selectedPlatforms })
                      });
                    } else {
                      response = await fetch('/api/posts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          type: 'text',
                          content,
                          teamId: selectedTeamId,
                          platforms: selectedPlatforms,
                          metadata: {}
                        })
                      });
                    }

                    const result = await response.json();
                    
                    if (response.ok) {
                      notifications.addNotification({
                        type: "success",
                        title: editId ? "Post Updated!" : "Post Saved!",
                        message: editId ? "Your changes have been saved" : `Text post saved to ${selectedTeam?.name || 'team'}/text/`
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
                disabled={isSaving || loadingExisting}
              >
                {isSaving || loadingExisting ? (
                  <InlineSpinner size="sm" className="mr-2" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {loadingExisting ? 'Loading...' : isSaving ? 'Saving...' : (editId ? 'Save Changes' : 'Save Post')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 pt-24">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Platform Selection - Compact */}
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

            {/* Content Creation */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Write your post
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="What's on your mind? Use formatting, #hashtags, @mentions, and links..."
                  platforms={platforms}
                  selectedPlatforms={selectedPlatforms}
                />
              </CardContent>
            </Card>

          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="sticky top-24">
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPlatforms.length > 0 ? (
                     <Tabs defaultValue={selectedPlatforms[0]} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
                        {selectedPlatforms.map((platform) => (
                          <TabsTrigger key={platform} value={platform} className="text-xs">
                            {platform === "X (Twitter)" ? "Twitter" : platform}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      
                      {selectedPlatforms.map((platform) => (
                        <TabsContent key={platform} value={platform} className="mt-0">
                          <div className="flex justify-center">
                            {platform === "Instagram" && (
                              <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm w-[375px] mx-auto">
                                {/* Header */}
                                <div className="flex items-center gap-3 p-3 border-b border-gray-50">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400"></div>
                                  <div>
                                    <p className="font-medium text-sm">your_brand</p>
                                    <p className="text-xs text-gray-500">2 minutes ago</p>
                                  </div>
                                </div>
                                
                                {/* Content */}
                                <div className="p-3">
                                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {formatContentWithColors(content)}
                                  </div>
                                </div>
                              </div>
                            )}

                            {platform === "X (Twitter)" && (
                              <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm w-[375px] mx-auto">
                                <div className="flex gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-sky-400 flex-shrink-0"></div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-medium text-sm">Your Brand</span>
                                      <span className="text-gray-500 text-sm">@yourbrand</span>
                                      <span className="text-gray-500 text-sm">· 2m</span>
                                    </div>
                                    
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                      {formatContentWithColors(content)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {platform === "LinkedIn" && (
                              <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm w-[375px] mx-auto">
                                {/* Header */}
                                <div className="flex items-center gap-3 p-3 border-b border-gray-50">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700"></div>
                                  <div>
                                    <p className="font-medium text-sm">Your Brand</p>
                                    <p className="text-xs text-gray-500">CEO at Company • 2m</p>
                                  </div>
                                </div>
                                
                                {/* Content */}
                                <div className="p-3">
                                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {formatContentWithColors(content)}
                                  </div>
                                </div>
                              </div>
                            )}

                            {platform === "Facebook" && (
                              <div className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm w-[375px] mx-auto">
                                {/* Header */}
                                <div className="flex items-center gap-3 p-3 border-b border-gray-50">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600"></div>
                                  <div>
                                    <p className="font-medium text-sm">Your Brand</p>
                                    <p className="text-xs text-gray-500">2 minutes ago</p>
                                  </div>
                                </div>
                                
                                {/* Content */}
                                <div className="p-3">
                                  <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                    {formatContentWithColors(content)}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  ) : (
                    <div className="text-center py-12">
                      <Eye className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm text-gray-500">Select platforms to see preview</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      </div>
      </AppShell>
  );
}

export default function MakePostTextPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex items-center justify-center py-12">
          <InlineSpinner size="sm" />
        </div>
      </AppShell>
    }>
      <MakePostTextContent />
    </Suspense>
  );
}