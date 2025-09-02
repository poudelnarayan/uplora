"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Image as ImageIcon, 
  ArrowLeft, 
  Upload, 
  Send, 
  Save,
  Calendar,
  Globe,
  X,
  Sliders,
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import PlatformBadge from  "@/components/ui/PlatformBadge";
import RichTextEditor from "@/components/editor/RichTextEditor";
import AppShell from "@/components/layout/AppLayout";

const MakePostImage = () => {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [saturation, setSaturation] = useState([100]);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["Instagram", "Facebook"]);

  const platforms = [
    { id: "Instagram", name: "Instagram", limit: 2200 },
    { id: "Facebook", name: "Facebook", limit: 63206 },
    { id: "X (Twitter)", name: "X (Twitter)", limit: 280 },
    { id: "LinkedIn", name: "LinkedIn", limit: 3000 }
  ];

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
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatContentWithColors = (text: string) => {
    if (!text) return <span className="text-gray-400">Write a caption for your image...</span>;
    
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

  const imageStyle = {
    filter: `brightness(${brightness[0]}%) contrast(${contrast[0]}%) saturate(${saturation[0]}%)`
  };

  return (
    <AppShell>

    <div className="min-h-screen bg-gray-50/50">

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-border/20 fixed top-0 left-0 right-0 z-20 lg:left-64">
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
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h1 className="font-semibold">Image Post</h1>
                  <p className="text-sm text-gray-500">Share visual content</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
              <Button size="sm" className="gap-2">
                <Send className="h-4 w-4" />
                Publish
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 pt-24">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Platform Selection */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Publish to</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
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

            {/* Image Upload */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Upload Image</CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedImage ? (
                  <div
                    className={`border-2 border-dashed rounded-lg h-48 flex flex-col items-center justify-center transition-all ${
                      dragActive 
                        ? "border-purple-400 bg-purple-50" 
                        : "border-gray-300 hover:border-purple-400"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-8 w-8 text-gray-400 mb-4" />
                    <p className="text-sm font-medium mb-2">Drop image here or click to upload</p>
                    <p className="text-xs text-gray-500 mb-4">PNG, JPG, GIF up to 10MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button asChild variant="outline">
                      <label htmlFor="image-upload" className="cursor-pointer">
                        Choose File
                      </label>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden group">
                      <img
                        src={selectedImage}
                        alt="Selected"
                        className="w-full h-48 object-cover"
                        style={imageStyle}
                      />
                      <Button 
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedImage(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Image Adjustments */}
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Sliders className="h-4 w-4" />
                        <span className="text-sm font-medium">Adjust</span>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-xs">Brightness</Label>
                            <span className="text-xs text-gray-500">{brightness[0]}%</span>
                          </div>
                          <Slider
                            value={brightness}
                            onValueChange={setBrightness}
                            max={200}
                            min={0}
                            step={1}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-xs">Contrast</Label>
                            <span className="text-xs text-gray-500">{contrast[0]}%</span>
                          </div>
                          <Slider
                            value={contrast}
                            onValueChange={setContrast}
                            max={200}
                            min={0}
                            step={1}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-xs">Saturation</Label>
                            <span className="text-xs text-gray-500">{saturation[0]}%</span>
                          </div>
                          <Slider
                            value={saturation}
                            onValueChange={setSaturation}
                            max={200}
                            min={0}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Caption */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Caption</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Write a caption for your image..."
                  platforms={platforms}
                  selectedPlatforms={selectedPlatforms}
                />
              </CardContent>
            </Card>

            {/* Scheduling */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Publish now</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Schedule</span>
                    </div>
                  </div>
                  <Switch 
                    checked={scheduleEnabled} 
                    onCheckedChange={setScheduleEnabled}
                  />
                </div>

                {scheduleEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t"
                  >
                    <Input type="date" />
                    <Input type="time" />
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-2 space-y-6">
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
                              <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg">
                                {/* Header */}
                                <div className="flex items-center justify-between p-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src="/api/placeholder/32/32" />
                                      <AvatarFallback className="text-xs">YB</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-semibold text-sm">your_brand</p>
                                      <p className="text-xs text-gray-500">2 minutes ago</p>
                                    </div>
                                  </div>
                                  <MoreHorizontal className="h-5 w-5 text-gray-600" />
                                </div>

                                {/* Image */}
                                {selectedImage ? (
                                  <div className="aspect-square">
                                    <img 
                                      src={selectedImage} 
                                      alt="Preview" 
                                      className="w-full h-full object-cover"
                                      style={imageStyle}
                                    />
                                  </div>
                                ) : (
                                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                                    <div className="text-gray-400 text-center">
                                      <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                                      <p className="text-sm">Your image here</p>
                                    </div>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="p-3">
                                  <div className="flex justify-between items-center mb-3">
                                    <div className="flex gap-4">
                                      <Heart className="h-6 w-6 cursor-pointer text-gray-700" />
                                      <MessageCircle className="h-6 w-6 cursor-pointer text-gray-700" />
                                      <Share className="h-6 w-6 cursor-pointer text-gray-700" />
                                    </div>
                                    <Bookmark className="h-6 w-6 cursor-pointer text-gray-700" />
                                  </div>

                                  <p className="font-semibold text-sm mb-2">1,234 likes</p>
                                  
                                  <div className="text-sm space-y-1">
                                    <div className="break-words">
                                      <span className="font-semibold">your_brand</span>
                                      {content && (
                                        <span className="ml-1 whitespace-pre-wrap leading-relaxed">
                                          {formatContentWithColors(content)}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Show more link for long content */}
                                    {content && content.length > 125 && (
                                      <button className="text-gray-500 text-sm">more</button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {platform === "Facebook" && (
                              <div className="w-full max-w-lg bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg">
                              {/* Header */}
                              <div className="flex items-center justify-between p-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src="/api/placeholder/32/32" />
                                    <AvatarFallback className="text-xs">YB</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-semibold text-sm">your_brand</p>
                                    <p className="text-xs text-gray-500">2 minutes ago</p>
                                  </div>
                                </div>
                                <MoreHorizontal className="h-5 w-5 text-gray-600" />
                              </div>

                                {/* Content */}
                                <div className="px-4 pb-3">
                                  <div className="text-sm mb-3 break-words whitespace-pre-wrap leading-relaxed">
                                    {content ? (
                                      <div>
                                        {content.length > 400 ? (
                                          <div>
                                            <span>{formatContentWithColors(content.substring(0, 400))}</span>
                                            <button className="text-blue-600 hover:underline ml-1 font-medium">
                                              ... See More
                                            </button>
                                          </div>
                                        ) : (
                                          formatContentWithColors(content)
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 italic">Write a caption for your image...</span>
                                    )}
                                  </div>
                                </div>

                                {/* Image */}
                                {selectedImage ? (
                                  <div className="aspect-video">
                                    <img 
                                      src={selectedImage} 
                                      alt="Preview" 
                                      className="w-full h-full object-cover"
                                      style={imageStyle}
                                    />
                                  </div>
                                ) : (
                                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                    <div className="text-gray-400 text-center">
                                      <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                                      <p className="text-sm">Your image here</p>
                                    </div>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="border-t border-gray-100 p-3">
                                  <div className="flex justify-around text-gray-600 text-sm">
                                    <button className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded">
                                      <Heart className="h-4 w-4" />
                                      Like
                                    </button>
                                    <button className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded">
                                      <MessageCircle className="h-4 w-4" />
                                      Comment
                                    </button>
                                    <button className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded">
                                      <Share className="h-4 w-4" />
                                      Share
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {platform === "X (Twitter)" && (
                              <div className="w-full max-w-lg bg-white border border-gray-200 rounded-xl p-4 shadow-lg">
                                <div className="flex gap-3">
                                  <Avatar className="h-10 w-10 flex-shrink-0">
                                    <AvatarImage src="/api/placeholder/40/40" />
                                    <AvatarFallback className="text-sm">YB</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-bold text-sm">Your Brand</span>
                                      <span className="text-gray-500 text-sm">@yourbrand</span>
                                      <span className="text-gray-500 text-sm">· 2m</span>
                                    </div>
                                    
                                    <div className="text-sm mb-3 break-words whitespace-pre-wrap leading-relaxed">
                                      {content ? (
                                        <div>
                                          {content.length > 280 ? (
                                            <div>
                                              <span>{formatContentWithColors(content.substring(0, 277))}</span>
                                              <span className="text-blue-500">...</span>
                                            </div>
                                          ) : (
                                            formatContentWithColors(content)
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 italic">What's happening?</span>
                                      )}
                                    </div>

                                    {selectedImage && (
                                      <div className="aspect-video bg-gray-100 rounded-xl mb-3 overflow-hidden">
                                        <img 
                                          src={selectedImage} 
                                          alt="Preview" 
                                          className="w-full h-full object-cover"
                                          style={imageStyle}
                                        />
                                      </div>
                                    )}

                                    <div className="flex justify-between max-w-md text-gray-500">
                                      <div className="flex items-center gap-2 cursor-pointer hover:text-gray-700">
                                        <MessageCircle className="h-4 w-4" />
                                        <span className="text-xs">24</span>
                                      </div>
                                      <div className="flex items-center gap-2 cursor-pointer hover:text-gray-700">
                                        <Share className="h-4 w-4" />
                                        <span className="text-xs">12</span>
                                      </div>
                                      <div className="flex items-center gap-2 cursor-pointer hover:text-gray-700">
                                        <Heart className="h-4 w-4" />
                                        <span className="text-xs">89</span>
                                      </div>
                                      <div className="flex items-center gap-2 cursor-pointer hover:text-gray-700">
                                        <Bookmark className="h-4 w-4" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {platform === "LinkedIn" && (
                              <div className="w-full max-w-lg bg-white border border-gray-200 rounded-lg overflow-hidden shadow-lg">
                                <div className="p-4">
                                  <div className="flex items-center gap-3 mb-3">
                                    <Avatar className="h-12 w-12 flex-shrink-0">
                                      <AvatarImage src="/api/placeholder/48/48" />
                                      <AvatarFallback className="text-sm">YB</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-sm">Your Brand</p>
                                      <p className="text-xs text-gray-500">CEO at Company • 1st</p>
                                      <p className="text-xs text-gray-500">2m • 🌐</p>
                                    </div>
                                  </div>
                                  
                                  <div className="text-sm mb-3 leading-relaxed break-words whitespace-pre-wrap">
                                    {content ? (
                                      <div>
                                        {content.length > 300 ? (
                                          <div>
                                            <span>{formatContentWithColors(content.substring(0, 300))}</span>
                                            <button className="text-blue-600 hover:underline ml-1 font-medium">
                                              ... see more
                                            </button>
                                          </div>
                                        ) : (
                                          formatContentWithColors(content)
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 italic">Share your professional insights...</span>
                                    )}
                                  </div>
                                </div>

                                {selectedImage && (
                                  <div className="aspect-video">
                                    <img 
                                      src={selectedImage} 
                                      alt="Preview" 
                                      className="w-full h-full object-cover"
                                      style={imageStyle}
                                    />
                                  </div>
                                )}

                                <div className="border-t border-gray-100 p-3">
                                  <div className="flex justify-around text-gray-600 text-sm">
                                    <button className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded">
                                      <Heart className="h-4 w-4" />
                                      Like
                                    </button>
                                    <button className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded">
                                      <MessageCircle className="h-4 w-4" />
                                      Comment
                                    </button>
                                    <button className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 rounded">
                                      <Share className="h-4 w-4" />
                                      Share
                                    </button>
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
                      <Eye className="h-12 w-12 mx-auto mb-4 opacity-50 text-gray-400" />
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
};

export default MakePostImage;