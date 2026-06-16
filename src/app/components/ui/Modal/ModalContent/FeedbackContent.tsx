"use client";

import { useState } from "react";
import { Send, Bug, Sparkles, Heart } from "lucide-react";

interface FeedbackContentProps {
  onSubmit: (type: string, message: string) => Promise<unknown>;
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

  const activeDef = feedbackTypes.find((t) => t.type === feedbackType);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type — single inline pill row, no big emoji card grid */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Type
        </label>
        <div className="flex flex-wrap gap-1.5">
          {feedbackTypes.map(({ type, label, icon }) => {
            const active = feedbackType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFeedbackType(type as any)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-foreground/80 hover:bg-muted/40"
                }`}
              >
                <span aria-hidden>{icon}</span>
                {label}
              </button>
            );
          })}
        </div>
        {activeDef && (
          <p className="text-[11px] text-muted-foreground">{activeDef.description}</p>
        )}
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what you think…"
          className="w-full min-h-[110px] p-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground/70 focus:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-colors resize-vertical text-foreground"
          required
        />
      </div>

      {/* Footer — split: cancel ghost / send primary */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-md text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !message.trim()}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary-hover disabled:opacity-60 transition-colors"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              Send
            </>
          )}
        </button>
      </div>
    </form>
  );
}