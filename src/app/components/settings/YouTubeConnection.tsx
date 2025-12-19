"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ExternalLink, Youtube } from "lucide-react";
import { useNotifications } from "@/app/components/ui/Notification";

const MotionDiv = motion.div as any;

interface YouTubeConnectionProps {
  isConnected: boolean;
  channelTitle?: string | null;
  onConnect: () => void;
}

export default function YouTubeConnection({ isConnected, channelTitle, onConnect }: YouTubeConnectionProps) {
  const notifications = useNotifications();
  const [isConnecting, setIsConnecting] = useState(false);

  // Check for error parameters in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ytError = urlParams.get('error');
    
    if (ytError) {
      let errorMessage = "YouTube connection failed";
      
      switch (ytError) {
        case 'youtube_connection_failed':
          errorMessage = "Failed to connect YouTube account. Please try again.";
          break;
        case 'youtube_token_failed':
          errorMessage = "Failed to authenticate with YouTube. Please try again.";
          break;
        case 'youtube_channel_failed':
          errorMessage = "Failed to fetch YouTube channel information. Please try again.";
          break;
        case 'youtube_no_code':
          errorMessage = "Authorization was cancelled or failed. Please try again.";
          break;
        case 'youtube_oauth_start_failed':
          errorMessage = "Failed to start YouTube authorization. Please try again.";
          break;
        default:
          errorMessage = "YouTube connection failed. Please try again.";
      }
      
      notifications.addNotification({
        type: "error",
        title: "YouTube Connection Failed",
        message: errorMessage
      });
      
      // Clean up the URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.toString());
    }
    
    // Check for success
    const success = urlParams.get('success');
    if (success === 'youtube_connected') {
      notifications.addNotification({
        type: "success",
        title: "YouTube Connected!",
        message: "Your YouTube account has been successfully connected."
      });
      
      // Clean up the URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('success');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [notifications]);

  const handleConnect = async () => {
    if (isConnecting) return; // Prevent double-clicks
    
    setIsConnecting(true);
    try {
      // ✅ Start at the start route, NOT the callback
      window.location.href = "/api/youtube/start";
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "Connection Failed",
        message: "Failed to start YouTube connection. Please try again."
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch("/api/youtube/disconnect", { method: "POST" });
      if (response.ok) {
        notifications.addNotification({
          type: "success",
          title: "Disconnected",
          message: "YouTube account disconnected successfully."
        });
        window.location.reload();
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "Disconnect Failed",
        message: "Failed to disconnect YouTube account. Please try again."
      });
    }
  };

  return (
    <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="space-y-4">
        {isConnected ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg border bg-primary/10 border-primary/30">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Connected to YouTube</span>
              </div>
              <p className="text-sm mt-1 text-muted-foreground">
                Channel: {channelTitle || "(no title)"}
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleDisconnect} 
                className="btn btn-secondary flex-1"
                disabled={isConnecting}
              >
                Disconnect YouTube
              </button>
              <a 
                href="https://studio.youtube.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-outline flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                YouTube Studio
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg border bg-warning-muted border-warning/30">
              <div className="flex items-center gap-2 text-warning">
                <Youtube className="w-4 h-4" />
                <span className="text-sm font-medium">YouTube Not Connected</span>
              </div>
              <p className="text-sm mt-1 text-muted-foreground">
                Connect your YouTube account to upload videos directly
              </p>
            </div>

            <button 
              onClick={handleConnect} 
              className="btn btn-primary w-full flex items-center gap-2"
              disabled={isConnecting}
            >
              <Youtube className="w-4 h-4" />
              {isConnecting ? "Connecting..." : "Connect YouTube"}
            </button>
          </div>
        )}
      </div>
    </MotionDiv>
  );
}
