"use client";

import { useState } from "react";
import { motion } from "framer-motion";
const MotionDiv = motion.div as any;
import { Youtube, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useNotifications } from "@/components/ui/Notification";

interface YouTubeConnectionProps {
  isConnected: boolean;
  channelTitle?: string | null;
  onConnect: () => void;
}

export default function YouTubeConnection({ isConnected, channelTitle, onConnect }: YouTubeConnectionProps) {
  const notifications = useNotifications();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    try {
      // ✅ Start at the start route, NOT the callback
      window.location.href = "/api/youtube/start";
    } catch {
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
    } catch {
      notifications.addNotification({
        type: "error",
        title: "Disconnect Failed",
        message: "Failed to disconnect YouTube account. Please try again."
      });
    }
  };

  return (
    <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <Youtube className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">YouTube Connection</h3>
            <p className="text-sm text-muted-foreground">Connect your YouTube channel to upload videos</p>
          </div>
        </div>
        {isConnected && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Connected</span>
          </div>
        )}
      </div>

      {isConnected ? (
        <div className="space-y-4">
          <div className="p-3 rounded-lg border" style={{ backgroundColor: 'rgba(0, 173, 181, 0.1)', borderColor: 'rgba(0, 173, 181, 0.3)' }}>
            <div className="flex items-center gap-2" style={{ color: 'rgb(0, 173, 181)' }}>
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Connected to YouTube</span>
            </div>
            <p className="text-sm mt-1" style={{ color: 'rgb(57, 62, 70)' }}>
              Channel: {channelTitle || "Your Channel"}
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={handleDisconnect} className="btn btn-secondary flex-1">Disconnect YouTube</button>
            <a href="https://studio.youtube.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              YouTube Studio
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 rounded-lg border" style={{ backgroundColor: 'rgba(57, 62, 70, 0.1)', borderColor: 'rgba(57, 62, 70, 0.3)' }}>
            <div className="flex items-center gap-2" style={{ color: 'rgb(57, 62, 70)' }}>
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Not Connected</span>
            </div>
            <p className="text-sm mt-1" style={{ color: 'rgb(57, 62, 70)' }}>
              Connect your YouTube channel to start uploading videos
            </p>
          </div>

          <button onClick={handleConnect} disabled={isConnecting} className="btn btn-primary w-full flex items-center justify-center gap-2">
            {isConnecting ? (
              <>
                <div className="spinner w-4 h-4" />
                Connecting...
              </>
            ) : (
              <>
                <Youtube className="w-4 h-4" />
                Connect YouTube Channel
              </>
            )}
          </button>
        </div>
      )}
    </MotionDiv>
  );
}
