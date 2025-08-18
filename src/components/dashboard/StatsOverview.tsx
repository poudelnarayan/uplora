"use client";

import { motion } from "framer-motion";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface VideoItem {
  status: "PROCESSING" | "PENDING" | "PUBLISHED";
}

interface StatsOverviewProps {
  videos: VideoItem[];
}

export default function StatsOverview({ videos }: StatsOverviewProps) {
  const publishedCount = videos.filter(v => v.status === "PUBLISHED").length;
  const pendingCount = videos.filter(v => v.status === "PENDING").length;
  const processingCount = videos.filter(v => v.status === "PROCESSING").length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: 0.1 }} 
      className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8"
    >
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Published</p>
            <p className="text-2xl font-bold text-foreground">{publishedCount}</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Awaiting Publish</p>
            <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Processing</p>
            <p className="text-2xl font-bold text-foreground">{processingCount}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}