"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileVideo, X, Youtube, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function UploadZone() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [s3Key, setS3Key] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [videoTitle, setVideoTitle] = useState("My Awesome Video");
  const [videoDescription, setVideoDescription] = useState("Uploaded with YTUploader");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const videoFile = droppedFiles.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      setFile(videoFile);
    } else {
      toast.error("Please drop a video file");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      const presign = await fetch("/api/s3/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      }).then((r) => r.json());

      setUploadProgress(30);

      const putRes = await fetch(presign.url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      setUploadProgress(80);

      if (!putRes.ok) {
        const fallback = await fetch(
          `/api/s3/upload?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`,
          { method: "POST", body: file }
        ).then((r) => r.json());
        setS3Key(fallback.key);
        setUploadProgress(100);
        toast.success("File uploaded successfully!");
        return;
      }

      setS3Key(presign.key);
      setUploadProgress(100);
      toast.success("File uploaded successfully!");
    } catch (error) {
      toast.error("Upload failed. Please try again.");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!s3Key) return;
    
    setIsPublishing(true);
    
    try {
      const response = await fetch("/api/youtube/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          key: s3Key, 
          title: videoTitle, 
          description: videoDescription, 
          privacyStatus: "private" 
        }),
      });

      const result = await response.json();

      if (result.id) {
        toast.success(`Video published to YouTube! ID: ${result.id}`);
        // Reset form
        setFile(null);
        setS3Key("");
        setUploadProgress(0);
        setVideoTitle("My Awesome Video");
        setVideoDescription("Uploaded with YTUploader");
      } else {
        toast.error(result.error || "Failed to publish video");
      }
    } catch (error) {
      toast.error("Failed to publish video");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
      >
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full glass glow flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Upload Video</h2>
          </div>

          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
                  isDragOver
                    ? 'border-blue-400 bg-blue-500/10 glow'
                    : 'border-white/30 hover:border-white/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div className="space-y-4">
                  <div className="w-20 h-20 rounded-full glass mx-auto flex items-center justify-center">
                    <FileVideo className="w-10 h-10 text-white/60" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Drop your video here
                    </h3>
                    <p className="text-white/60">
                      or click to browse your files
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['MP4', 'MOV', 'AVI', 'WebM'].map(format => (
                      <span
                        key={format}
                        className="px-3 py-1 rounded-full glass text-sm text-white/80"
                      >
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="file-preview"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-4"
              >
                <div className="glass rounded-xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl glass glow-green flex items-center justify-center">
                      <FileVideo className="w-8 h-8 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg truncate">
                        {file.name}
                      </h3>
                      <p className="text-white/60">
                        {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                      </p>
                    </div>
                    {!isUploading && (
                      <button
                        onClick={() => setFile(null)}
                        className="w-10 h-10 rounded-full glass hover:glow-red transition-all flex items-center justify-center"
                      >
                        <X className="w-5 h-5 text-white/60" />
                      </button>
                    )}
                  </div>

                  {isUploading && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/80">Uploading...</span>
                        <span className="text-white/80">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 glass rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${uploadProgress}%` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {!s3Key && (
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="btn btn-primary w-full"
                  >
                    {isUploading ? (
                      <>
                        <div className="spinner" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Upload to S3
                      </>
                    )}
                  </button>
                )}

                {s3Key && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass glow-green rounded-xl p-4 flex items-center gap-3"
                  >
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <div>
                      <p className="text-white font-semibold">Upload Complete!</p>
                      <p className="text-white/60 text-sm">Ready to publish to YouTube</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Publish Section */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full glass glow-red flex items-center justify-center">
              <Youtube className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Publish to YouTube</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Video Title
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="input"
                placeholder="Enter video title..."
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                className="input resize-none h-32"
                placeholder="Enter video description..."
              />
            </div>

            <button
              onClick={handlePublish}
              disabled={!s3Key || isPublishing}
              className={`btn w-full ${
                s3Key ? "btn-success" : "btn-secondary opacity-50 cursor-not-allowed"
              }`}
            >
              {isPublishing ? (
                <>
                  <div className="spinner" />
                  Publishing...
                </>
              ) : (
                <>
                  <Youtube className="w-5 h-5" />
                  Publish to YouTube
                </>
              )}
            </button>

            {!s3Key && (
              <p className="text-white/60 text-sm text-center">
                Upload a video first to enable publishing
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
