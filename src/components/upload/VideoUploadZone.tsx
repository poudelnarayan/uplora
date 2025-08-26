"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Video, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Cloud,
  Play,
  FileVideo,
  Trash2
} from "lucide-react";
import { useNotifications } from "@/components/ui/Notification";

const MotionDiv = motion.div as any;

interface VideoUploadZoneProps {
  onUploadComplete?: (videoId: string) => void;
  teamId?: string | null;
  className?: string;
}

interface UploadProgress {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  fileName?: string;
  fileSize?: number;
  error?: string;
  videoId?: string;
}

export default function VideoUploadZone({ 
  onUploadComplete, 
  teamId, 
  className = "" 
}: VideoUploadZoneProps) {
  const notifications = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [uploadState, setUploadState] = useState<UploadProgress>({
    status: 'idle',
    progress: 0
  });
  const [isDragOver, setIsDragOver] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const resetUpload = () => {
    setUploadState({ status: 'idle', progress: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('video/')) {
      return 'Please select a valid video file';
    }

    // Check file size (500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return 'File size must be less than 500MB';
    }

    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      notifications.addNotification({
        type: "error",
        title: "Invalid file",
        message: error
      });
      return;
    }

    setUploadState({
      status: 'uploading',
      progress: 0,
      fileName: file.name,
      fileSize: file.size
    });

    startUpload(file);
  }, [notifications]);

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
    
    if (uploadState.status === 'uploading') return;
    
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      handleFileSelect(videoFile);
    } else {
      notifications.addNotification({
        type: "error",
        title: "Invalid file type",
        message: "Please drop a video file"
      });
    }
  }, [uploadState.status, handleFileSelect, notifications]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const startUpload = async (file: File) => {
    try {
      // Create abort controller for this upload
      abortControllerRef.current = new AbortController();
      
      // Step 1: Initialize multipart upload
      setUploadState(prev => ({ ...prev, status: 'uploading', progress: 5 }));
      
      const initResponse = await fetch("/api/s3/multipart/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          filename: file.name, 
          contentType: file.type || "video/mp4",
          teamId 
        }),
        signal: abortControllerRef.current.signal
      });

      if (!initResponse.ok) {
        throw new Error(`Failed to initialize upload: ${initResponse.statusText}`);
      }

      const initData = await initResponse.json();
      const { key, uploadId, partSize = 8 * 1024 * 1024 } = initData;

      // Step 2: Upload parts
      const totalParts = Math.ceil(file.size / partSize);
      const uploadedParts: Array<{ ETag: string; PartNumber: number }> = [];
      let completedBytes = 0;

      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        // Check if upload was cancelled
        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Upload cancelled');
        }

        const start = (partNumber - 1) * partSize;
        const end = Math.min(start + partSize, file.size);
        const chunk = file.slice(start, end);

        // Get presigned URL for this part
        const signResponse = await fetch("/api/s3/multipart/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, uploadId, partNumber }),
          signal: abortControllerRef.current.signal
        });

        if (!signResponse.ok) {
          throw new Error(`Failed to get upload URL for part ${partNumber}`);
        }

        const { url } = await signResponse.json();

        // Upload the part
        const uploadResponse = await fetch(url, {
          method: "PUT",
          body: chunk,
          signal: abortControllerRef.current.signal
        });

        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload part ${partNumber}`);
        }

        const etag = uploadResponse.headers.get('ETag')?.replace(/"/g, '');
        if (!etag) {
          throw new Error(`No ETag received for part ${partNumber}`);
        }

        uploadedParts.push({ ETag: etag, PartNumber: partNumber });
        completedBytes += chunk.size;

        // Update progress
        const progress = Math.min(90, (completedBytes / file.size) * 90);
        setUploadState(prev => ({ ...prev, progress }));
      }

      // Step 3: Complete multipart upload
      setUploadState(prev => ({ ...prev, status: 'processing', progress: 95 }));

      const completeResponse = await fetch("/api/s3/multipart/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          uploadId,
          parts: uploadedParts,
          originalFilename: file.name,
          contentType: file.type || "video/mp4",
          sizeBytes: file.size,
          teamId
        }),
        signal: abortControllerRef.current.signal
      });

      if (!completeResponse.ok) {
        throw new Error(`Failed to complete upload: ${completeResponse.statusText}`);
      }

      const completeData = await completeResponse.json();
      
      // Step 4: Upload completed
      setUploadState(prev => ({ 
        ...prev, 
        status: 'completed', 
        progress: 100,
        videoId: completeData.videoId 
      }));

      notifications.addNotification({
        type: "success",
        title: "Upload successful!",
        message: `${file.name} has been uploaded successfully`
      });

      // Call completion callback
      if (onUploadComplete && completeData.videoId) {
        onUploadComplete(completeData.videoId);
      }

    } catch (error) {
      console.error('Upload error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploadState(prev => ({ 
        ...prev, 
        status: 'failed', 
        error: errorMessage 
      }));

      notifications.addNotification({
        type: "error",
        title: "Upload failed",
        message: errorMessage
      });
    }
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    resetUpload();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = () => {
    switch (uploadState.status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-6 h-6 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Upload className="w-6 h-6" />;
    }
  };

  const getStatusText = () => {
    switch (uploadState.status) {
      case 'uploading':
        return 'Uploading video...';
      case 'processing':
        return 'Processing video...';
      case 'completed':
        return 'Upload completed!';
      case 'failed':
        return 'Upload failed';
      default:
        return 'Drop a video file or click to select';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Upload Zone */}
      <MotionDiv
        ref={dropZoneRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => uploadState.status === 'idle' && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl cursor-pointer
          transition-all duration-200 ease-out p-8 min-h-[300px]
          ${uploadState.status === 'idle' 
            ? isDragOver
              ? 'border-[#00ADB5] bg-gradient-to-br from-[#00ADB5]/5 to-[#00ADB5]/10 scale-[1.02] shadow-lg'
              : 'border-[#393E46] bg-gradient-to-br from-[#EEEEEE] to-white hover:border-[#00ADB5] hover:shadow-md hover:scale-[1.01]'
            : 'cursor-default'
          }
        `}
        whileHover={uploadState.status === 'idle' ? { scale: 1.01 } : {}}
        whileTap={uploadState.status === 'idle' ? { scale: 0.99 } : {}}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={uploadState.status === 'uploading'}
        />

        {/* Upload Content */}
        <div className="flex flex-col items-center justify-center text-center h-full space-y-6">
          {/* Status Icon */}
          <MotionDiv
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, type: "spring" }}
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ 
              backgroundColor: uploadState.status === 'completed' 
                ? 'rgba(34, 197, 94, 0.1)' 
                : uploadState.status === 'failed'
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(0, 173, 181, 0.1)'
            }}
          >
            {getStatusIcon()}
          </MotionDiv>

          {/* Status Text */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold" style={{ color: 'rgb(34, 40, 49)' }}>
              {getStatusText()}
            </h3>
            
            {uploadState.fileName && (
              <p className="text-sm" style={{ color: 'rgb(57, 62, 70)' }}>
                {uploadState.fileName}
                {uploadState.fileSize && ` (${formatFileSize(uploadState.fileSize)})`}
              </p>
            )}

            {uploadState.error && (
              <p className="text-sm text-red-600">{uploadState.error}</p>
            )}
          </div>

          {/* Progress Bar */}
          {uploadState.status === 'uploading' && (
            <MotionDiv
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md space-y-2"
            >
              <div className="w-full bg-gray-200 rounded-full h-3">
                <MotionDiv
                  className="bg-gradient-to-r from-[#00ADB5] to-[#00ADB5]/80 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadState.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm font-medium" style={{ color: 'rgb(57, 62, 70)' }}>
                {Math.round(uploadState.progress)}% complete
              </p>
            </MotionDiv>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {uploadState.status === 'idle' && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 rounded-lg font-medium transition-all hover:scale-105"
                style={{ 
                  backgroundColor: 'rgb(0, 173, 181)',
                  color: 'white'
                }}
              >
                Select Video
              </button>
            )}

            {uploadState.status === 'uploading' && (
              <button
                onClick={cancelUpload}
                className="px-6 py-3 rounded-lg font-medium border-2 transition-all hover:scale-105"
                style={{ 
                  borderColor: 'rgb(239, 68, 68)',
                  color: 'rgb(239, 68, 68)',
                  backgroundColor: 'transparent'
                }}
              >
                Cancel Upload
              </button>
            )}

            {(uploadState.status === 'completed' || uploadState.status === 'failed') && (
              <button
                onClick={resetUpload}
                className="px-6 py-3 rounded-lg font-medium transition-all hover:scale-105"
                style={{ 
                  backgroundColor: 'rgb(0, 173, 181)',
                  color: 'white'
                }}
              >
                Upload Another Video
              </button>
            )}
          </div>
        </div>
      </MotionDiv>
    </div>
  );
}
