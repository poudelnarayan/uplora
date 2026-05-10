"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { TextField } from "@/app/components/ui/TextField";

interface IdeaLabContentProps {
  onSubmit: (title: string, description: string, priority: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const priorities = [
  { priority: "low", label: "Low" },
  { priority: "medium", label: "Medium" },
  { priority: "high", label: "High" },
] as const;

export default function IdeaLabContent({ 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: IdeaLabContentProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;
    
    await onSubmit(formData.title.trim(), formData.description.trim(), formData.priority);
    setFormData({ title: "", description: "", priority: "medium" });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Title"
          placeholder="What should we build?"
          value={formData.title}
          onChange={(e) => setFormData({ 
            ...formData, 
            title: (e.target as HTMLInputElement).value 
          })}
          required
        />

        {/* Priority Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Priority</label>
          <div className="inline-flex w-full rounded-lg border border-border/60 bg-muted/20 p-1">
            {priorities.map(({ priority, label }) => (
              <button
                key={priority}
                type="button"
                onClick={() => setFormData({ ...formData, priority: priority as any })}
                aria-pressed={formData.priority === priority}
                className={[
                  "flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                  formData.priority === priority
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <TextField
          multiline
          label="Details"
          placeholder="What problem does it solve? Any examples?"
          value={formData.description}
          onChange={(e) =>
            setFormData({
              ...formData,
              description: (e.target as HTMLTextAreaElement).value,
            })
          }
          required
        />

        {/* Footer — split: cancel ghost / submit primary (matches Feedback) */}
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
            disabled={isLoading || !formData.title.trim() || !formData.description.trim()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary-hover disabled:opacity-60 transition-colors"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Submit
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}