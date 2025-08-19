"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const MotionDiv = MotionDiv as any;
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
    setIsConnecting(true);
    try {
      // Redirect to YouTube OAuth
      window.location.href = "/api/youtube/connect";
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
      const response = await fetch("/api/youtube/disconnect", {
        method: "POST",
      });

      if (response.ok) {
        notifications.addNotification({
          type: "success",
          title: "Disconnected",
          message: "YouTube account disconnected successfully."
        });
        // Refresh the page to update the connection status
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
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <Youtube className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">YouTube Connection</h3>
            <p className="text-sm text-muted-foreground">
              Connect your YouTube channel to upload videos
            </p>
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
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Connected to YouTube</span>
            </div>
            {channelTitle && (
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Channel: {channelTitle}
              </p>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleDisconnect}
              className="btn btn-secondary flex-1"
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
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Not Connected</span>
            </div>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
              Connect your YouTube channel to start uploading videos
            </p>
          </div>
          
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
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
