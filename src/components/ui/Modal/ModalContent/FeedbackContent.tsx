"use client";

import { useState } from "react";
import { Send, Bug, Sparkles, Heart } from "lucide-react";

interface FeedbackContentProps {
  onSubmit: (type: string, message: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const feedbackTypes = [
  { 
    type: "bug", 
    label: "Bug Report", 
    icon: "🐛", 
    color: "from-red-500/20 to-pink-500/20",
    description: "Something isn't working correctly"
  },
  { 
    type: "improvement", 
    label: "Improvement", 
    icon: "✨", 
    color: "from-blue-500/20 to-indigo-500/20",
    description: "Suggest ways to make it better"
  },
  { 
    type: "praise", 
    label: "Praise", 
    icon: "❤️", 
    color: "from-green-500/20 to-emerald-500/20",
    description: "Share what you love about Uplora"
  }
] as const;

export default function FeedbackContent({ 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: FeedbackContentProps) {
  const [feedbackType, setFeedbackType] = useState<"bug" | "improvement" | "praise">("improvement");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    await onSubmit(feedbackType, message.trim());
    setMessage("");
  };

  return (
    <div className="space-y-6">
      {/* Feedback Type Selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium" style={{ color: 'hsl(210, 40%, 25%)' }}>
          What's on your mind?
        </label>
        <div className="grid grid-cols-3 gap-3">
          {feedbackTypes.map(({ type, label, icon, color, description }) => (
            <button
              key={type}
              type="button"
              onClick={() => setFeedbackType(type as any)}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                ${feedbackType === type
                  ? `border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm`
                  : "border-slate-200 bg-slate-50/50 hover:border-emerald-300 hover:bg-emerald-50/30"
                }
              `}
              style={{ 
                color: feedbackType === type ? 'hsl(210, 40%, 25%)' : 'hsl(176, 20%, 16%)'
              }}
            >
              <div className="text-2xl">{icon}</div>
              <div className="text-xs font-semibold text-center">{label}</div>
            </button>
          ))}
        </div>
        <p className="text-xs" style={{ color: 'hsl(176, 20%, 16%)' }}>
          {feedbackTypes.find(t => t.type === feedbackType)?.description}
        </p>
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: 'hsl(210, 40%, 25%)' }}>
            Your message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you think..."
            className="
              w-full min-h-[120px] p-3 rounded-lg border border-slate-200 
              bg-slate-50/50 placeholder:opacity-60
              focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200/50
              transition-all resize-vertical
            "
            style={{ color: 'hsl(176, 20%, 16%)', '::placeholder': { color: 'hsl(176, 20%, 16%)' } }}
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-200/80">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition-all"
            style={{ color: 'hsl(176, 20%, 16%)' }}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="flex-1 px-4 py-2 rounded-lg text-white transition-all flex items-center justify-center gap-2 hover:shadow-lg"
            style={{ backgroundColor: 'hsl(210, 55%, 45%)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(210, 40%, 25%)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'hsl(210, 55%, 45%)'}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Feedback
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}