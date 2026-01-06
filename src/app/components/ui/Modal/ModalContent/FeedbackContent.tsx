"use client";

import { useState } from "react";
import { Send, Bug, Sparkles, Heart } from "lucide-react";

interface FeedbackContentProps {
  onSubmit: (type: string, message: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const feedbackTypes = [
  { type: "bug", label: "Bug Report", icon: "🐛", description: "Something isn't working correctly" },
  { type: "improvement", label: "Improvement", icon: "✨", description: "Suggest ways to make it better" },
  { type: "praise", label: "Praise", icon: "❤️", description: "Share what you love about Uplora" },
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
          {feedbackTypes.map(({ type, label, icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => setFeedbackType(type as any)}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors
                ${feedbackType === type
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border/60 bg-background hover:bg-muted/30 hover:border-border text-muted-foreground"
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
            className="w-full min-h-[120px] p-3 rounded-lg border border-border/60 bg-background placeholder:text-muted-foreground/70 focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-colors resize-vertical text-foreground shadow-none"
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-all text-foreground"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="flex-1 px-4 py-2 rounded-lg text-primary-foreground transition-colors flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-60"
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