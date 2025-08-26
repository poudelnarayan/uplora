"use client";

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = "Loading Teams" }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div 
          className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" 
          style={{ borderColor: '#00ADB5', borderTopColor: 'transparent' }} 
        />
        <h3 className="text-xl font-semibold mb-2" style={{ color: '#222831' }}>{message}</h3>
        <p style={{ color: '#393E46' }}>Fetching your team information...</p>
      </div>
    </div>
  );
}
