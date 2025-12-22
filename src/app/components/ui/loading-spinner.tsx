import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const variantClasses = {
  default: 'text-muted-foreground',
  primary: 'text-primary',
  secondary: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-destructive'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
  text,
  fullScreen = false
}) => {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-border',
          sizeClasses[size],
          variantClasses[variant],
          'border-t-current'
        )}
      />
      {text && (
        <p className={cn('text-sm font-medium', variantClasses[variant])}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Inline loading spinner for buttons and small spaces
export const InlineSpinner: React.FC<{ size?: 'sm' | 'md'; className?: string }> = ({
  size = 'sm',
  className
}) => (
  <div
    className={cn(
      'animate-spin rounded-full border-2 border-border border-t-primary',
      size === 'sm' ? 'w-4 h-4' : 'w-5 h-5',
      className
    )}
  />
);

// Page loading component
export const PageLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-full max-w-sm px-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <InlineSpinner size="md" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="mt-2 h-3 w-48 bg-muted/70 rounded animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  </div>
);

// Card loading skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse', className)}>
    <div className="bg-muted rounded-lg h-48 w-full mb-4"></div>
    <div className="space-y-2">
      <div className="bg-muted rounded h-4 w-3/4"></div>
      <div className="bg-muted rounded h-4 w-1/2"></div>
    </div>
  </div>
);

// List loading skeleton
export const ListSkeleton: React.FC<{ count?: number; className?: string }> = ({ 
  count = 3, 
  className 
}) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="animate-pulse flex items-center space-x-4">
        <div className="bg-muted rounded-full h-12 w-12"></div>
        <div className="flex-1 space-y-2">
          <div className="bg-muted rounded h-4 w-3/4"></div>
          <div className="bg-muted rounded h-3 w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

// Table loading skeleton
export const TableSkeleton: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 4,
  className
}) => (
  <div className={cn('animate-pulse', className)}>
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="bg-muted rounded h-4 flex-1"
              style={{ width: `${Math.random() * 40 + 60}%` }}
            ></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default LoadingSpinner;
