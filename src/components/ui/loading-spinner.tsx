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
  default: 'text-gray-600',
  primary: 'text-blue-600',
  secondary: 'text-gray-500',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600'
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
          'animate-spin rounded-full border-2 border-gray-200',
          sizeClasses[size],
          variantClasses[variant],
          'border-t-current'
        )}
        style={{
          animation: 'spin 1s linear infinite'
        }}
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
      'animate-spin rounded-full border-2 border-gray-200 border-t-blue-600',
      size === 'sm' ? 'w-4 h-4' : 'w-5 h-5',
      className
    )}
  />
);

// Page loading component
export const PageLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <LoadingSpinner size="xl" variant="primary" text={text} />
  </div>
);

// Card loading skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse', className)}>
    <div className="bg-gray-200 rounded-lg h-48 w-full mb-4"></div>
    <div className="space-y-2">
      <div className="bg-gray-200 rounded h-4 w-3/4"></div>
      <div className="bg-gray-200 rounded h-4 w-1/2"></div>
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
        <div className="bg-gray-200 rounded-full h-12 w-12"></div>
        <div className="flex-1 space-y-2">
          <div className="bg-gray-200 rounded h-4 w-3/4"></div>
          <div className="bg-gray-200 rounded h-3 w-1/2"></div>
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
              className="bg-gray-200 rounded h-4 flex-1"
              style={{ width: `${Math.random() * 40 + 60}%` }}
            ></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default LoadingSpinner;
