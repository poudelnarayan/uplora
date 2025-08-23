"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  File, 
  Image, 
  Video, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Cloud,
  Plus
} from "lucide-react";

const MotionDiv = motion.div as any;

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "compact" | "minimal";
  showPreview?: boolean;
}

interface UploadState {
  isDragOver: boolean;
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
  files: File[];
}

export default function FileUpload({
  onFileSelect,
  acceptedTypes = ["image/*", "video/*", ".pdf", ".doc", ".docx"],
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  maxFiles = 5,
  disabled = false,
  className = "",
  variant = "default",
  showPreview = true
}: FileUploadProps) {
  const [state, setState] = useState<UploadState>({
    isDragOver: false,
    isUploading: false,
    progress: 0,
    error: null,
    success: false,
    files: []
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // File type validation
  const validateFile = useCallback((file: File): string | null => {
    // Size validation
    if (file.size > maxFileSize) {
      return `File size must be less than ${formatFileSize(maxFileSize)}`;
    }

    // Type validation
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isValidType) {
      return `File type not supported. Accepted: ${acceptedTypes.join(', ')}`;
    }

    return null;
  }, [acceptedTypes, maxFileSize]);

  // Handle file selection
  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Validate file count
    if (fileArray.length > maxFiles) {
      setState(prev => ({ 
        ...prev, 
        error: `Maximum ${maxFiles} files allowed` 
      }));
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    let firstError: string | null = null;

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error && !firstError) {
        firstError = error;
        break;
      }
      if (!error) {
        validFiles.push(file);
      }
    }

    if (firstError) {
      setState(prev => ({ ...prev, error: firstError }));
      return;
    }

    // Success - update state and call callback
    setState(prev => ({ 
      ...prev, 
      files: validFiles, 
      error: null, 
      success: true 
    }));
    
    onFileSelect(validFiles);

    // Auto-clear success state after 3 seconds
    setTimeout(() => {
      setState(prev => ({ ...prev, success: false }));
    }, 3000);
  }, [maxFiles, validateFile, onFileSelect]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setState(prev => ({ ...prev, isDragOver: true, error: null }));
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragOver to false if we're leaving the drop zone entirely
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setState(prev => ({ ...prev, isDragOver: false }));
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, isDragOver: false }));
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, handleFiles]);

  // Click handler
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // File input change handler
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFiles]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-6 h-6" />;
    if (file.type.startsWith('video/')) return <Video className="w-6 h-6" />;
    if (file.type.includes('pdf')) return <FileText className="w-6 h-6" />;
    return <File className="w-6 h-6" />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Remove file from selection
  const removeFile = useCallback((index: number) => {
    setState(prev => {
      const newFiles = prev.files.filter((_, i) => i !== index);
      return { ...prev, files: newFiles };
    });
  }, []);

  // Base classes for different variants
  const getVariantClasses = () => {
    switch (variant) {
      case "compact":
        return "p-6 min-h-[200px]";
      case "minimal":
        return "p-4 min-h-[120px]";
      default:
        return "p-8 min-h-[280px]";
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Main Upload Zone */}
      <MotionDiv
        ref={dropZoneRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-2xl cursor-pointer
          transition-all duration-200 ease-out
          ${getVariantClasses()}
          ${disabled 
            ? 'opacity-50 cursor-not-allowed border-gray-300 bg-gray-50' 
            : state.isDragOver
              ? 'border-[#00ADB5] bg-gradient-to-br from-[#00ADB5]/5 to-[#00ADB5]/10 scale-[1.02] shadow-lg'
              : state.success
                ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50'
                : state.error
                  ? 'border-red-500 bg-gradient-to-br from-red-50 to-pink-50'
                  : 'border-[#393E46] bg-gradient-to-br from-[#EEEEEE] to-white hover:border-[#00ADB5] hover:shadow-md hover:scale-[1.01]'
          }
        `}
        whileHover={!disabled ? { scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.99 } : {}}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
          aria-label="File upload input"
        />

        {/* Upload Content */}
        <div className="flex flex-col items-center justify-center text-center h-full">
          {/* Icon with animation */}
          <MotionDiv
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: 1, 
              rotate: 0,
              y: state.isDragOver ? -5 : 0
            }}
            transition={{ 
              duration: 0.4, 
              type: "spring", 
              stiffness: 300, 
              damping: 20 
            }}
            className={`
              w-16 h-16 rounded-2xl mb-4 flex items-center justify-center
              ${state.success 
                ? 'bg-green-500 text-white' 
                : state.error
                  ? 'bg-red-500 text-white'
                  : state.isDragOver
                    ? 'bg-[#00ADB5] text-white'
                    : 'bg-[#393E46] text-white'
              }
            `}
          >
            <AnimatePresence mode="wait">
              {state.isUploading ? (
                <MotionDiv
                  key="loading"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <Loader2 className="w-8 h-8 animate-spin" />
                </MotionDiv>
              ) : state.success ? (
                <MotionDiv
                  key="success"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <CheckCircle className="w-8 h-8" />
                </MotionDiv>
              ) : state.error ? (
                <MotionDiv
                  key="error"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <AlertCircle className="w-8 h-8" />
                </MotionDiv>
              ) : state.isDragOver ? (
                <MotionDiv
                  key="dragover"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <Cloud className="w-8 h-8" />
                </MotionDiv>
              ) : (
                <MotionDiv
                  key="default"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <Upload className="w-8 h-8" />
                </MotionDiv>
              )}
            </AnimatePresence>
          </MotionDiv>

          {/* Text Content */}
          <MotionDiv
            animate={{ y: state.isDragOver ? -5 : 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <h3 className={`
              text-xl font-bold
              ${state.success 
                ? 'text-green-700' 
                : state.error
                  ? 'text-red-700'
                  : state.isDragOver
                    ? 'text-[#00ADB5]'
                    : 'text-[#222831]'
              }
            `}>
              {state.isUploading 
                ? 'Uploading files...'
                : state.success
                  ? 'Upload successful!'
                  : state.error
                    ? 'Upload failed'
                    : state.isDragOver
                      ? 'Drop files here'
                      : 'Upload your files'
              }
            </h3>
            
            <p className={`
              text-sm
              ${state.success 
                ? 'text-green-600' 
                : state.error
                  ? 'text-red-600'
                  : 'text-[#393E46]'
              }
            `}>
              {state.isUploading 
                ? `${state.progress}% complete`
                : state.success
                  ? `${state.files.length} file${state.files.length !== 1 ? 's' : ''} uploaded successfully`
                  : state.error
                    ? state.error
                    : state.isDragOver
                      ? 'Release to upload'
                      : 'Drag and drop files here, or click to browse'
              }
            </p>
          </MotionDiv>

          {/* File Type Indicators */}
          {!state.isUploading && !state.success && !state.error && (
            <MotionDiv
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex items-center gap-3 mt-6"
            >
              <div className="flex items-center gap-2">
                <Image className="w-5 h-5 text-[#00ADB5]" />
                <Video className="w-5 h-5 text-[#393E46]" />
                <FileText className="w-5 h-5 text-[#222831]" />
              </div>
              <span className="text-xs text-[#393E46] font-medium">
                Images, Videos, Documents
              </span>
            </MotionDiv>
          )}

          {/* Upload Specifications */}
          {!state.isUploading && !state.success && !state.error && variant === "default" && (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="mt-6 text-xs text-[#393E46] space-y-1"
            >
              <p>Maximum file size: {formatFileSize(maxFileSize)}</p>
              <p>Maximum files: {maxFiles}</p>
              <p>Supported formats: {acceptedTypes.slice(0, 3).join(', ')}{acceptedTypes.length > 3 ? '...' : ''}</p>
            </MotionDiv>
          )}
        </div>

        {/* Progress Bar */}
        <AnimatePresence>
          {state.isUploading && (
            <MotionDiv
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0 }}
              className="absolute bottom-0 left-0 right-0 h-1 bg-[#EEEEEE] rounded-b-2xl overflow-hidden"
            >
              <MotionDiv
                initial={{ width: 0 }}
                animate={{ width: `${state.progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#00ADB5] to-[#393E46]"
              />
            </MotionDiv>
          )}
        </AnimatePresence>

        {/* Drag Overlay */}
        <AnimatePresence>
          {state.isDragOver && (
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#00ADB5]/10 rounded-2xl border-2 border-[#00ADB5] flex items-center justify-center"
            >
              <MotionDiv
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <Cloud className="w-12 h-12 text-[#00ADB5] mx-auto mb-2" />
                <p className="text-lg font-bold text-[#00ADB5]">Drop files here</p>
              </MotionDiv>
            </MotionDiv>
          )}
        </AnimatePresence>
      </MotionDiv>

      {/* File Preview Section */}
      <AnimatePresence>
        {showPreview && state.files.length > 0 && (
          <MotionDiv
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mt-4 space-y-3"
          >
            <h4 className="text-sm font-semibold text-[#222831] flex items-center gap-2">
              <File className="w-4 h-4" />
              Selected Files ({state.files.length})
            </h4>
            
            <div className="space-y-2">
              {state.files.map((file, index) => (
                <MotionDiv
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.2 }}
                  className="flex items-center justify-between p-3 bg-white border border-[#EEEEEE] rounded-lg hover:border-[#00ADB5] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#EEEEEE] flex items-center justify-center text-[#393E46]">
                      {getFileIcon(file)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#222831] truncate max-w-[200px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-[#393E46]">
                        {formatFileSize(file.size)} • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="p-1 rounded-full hover:bg-red-100 text-red-500 transition-colors"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </MotionDiv>
              ))}
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {state.error && (
          <MotionDiv
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{state.error}</p>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {state.success && !state.error && (
          <MotionDiv
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700">
              Files ready for upload! Click submit to continue.
            </p>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}

// Export utility function for file size formatting
export { formatFileSize } from './utils';