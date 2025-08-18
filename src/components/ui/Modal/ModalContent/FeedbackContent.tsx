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
        <label className="text-sm font-medium text-foreground">
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
                  ? `border-primary bg-gradient-to-br ${color} text-foreground`
                  : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"
                }
              `}
            >
              <div className="text-2xl">{icon}</div>
              <div className="text-xs font-semibold text-center">{label}</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {feedbackTypes.find(t => t.type === feedbackType)?.description}
        </p>
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Your message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you think..."
            className="
              w-full min-h-[120px] p-3 rounded-lg border border-border 
              bg-input text-foreground placeholder:text-muted-foreground
              focus:border-primary focus:ring-2 focus:ring-primary/20
              transition-all resize-vertical
            "
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost flex-1"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="btn btn-primary flex-1"
          >
            {isLoading ? (
              <>
                <div className="spinner mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Feedback
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}