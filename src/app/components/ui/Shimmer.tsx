interface ShimmerProps {
  className?: string;
  children?: React.ReactNode;
}

export function Shimmer({ className = "", children }: ShimmerProps) {
  return (
    <div 
      className={`relative overflow-hidden bg-muted/30 shimmer ${className}`}
    >
      {children}
    </div>
  );
}

interface ThumbnailShimmerProps {
  className?: string;
  showIcon?: boolean;
  text?: string;
}

export function ThumbnailShimmer({ 
  className = "", 
  showIcon = true, 
  text = "Loading..." 
}: ThumbnailShimmerProps) {
  // Default size, but allow className to override
  const baseClasses = "rounded-lg border-2 border-primary/20";
  const sizeClasses = className.includes('w-') || className.includes('h-') ? "" : "w-40 h-24";
  
  return (
    <Shimmer 
      className={`${baseClasses} ${sizeClasses} ${className}`}
    >
      {showIcon && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-lg">
          <div className="flex flex-col items-center text-muted-foreground/60">
            <svg 
              className={`mb-1 ${className.includes('w-64') ? 'w-12 h-12' : 'w-8 h-8'}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21"/>
            </svg>
            <span className={`font-medium ${className.includes('w-64') ? 'text-sm' : 'text-xs'}`}>{text}</span>
          </div>
        </div>
      )}
    </Shimmer>
  );
}
