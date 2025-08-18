"use client";

import { useState } from "react";
import { Sparkles, Lightbulb, Target } from "lucide-react";
import { TextField } from "@/components/ui/TextField";

interface IdeaLabContentProps {
  onSubmit: (title: string, description: string, priority: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const priorities = [
  { 
    priority: "low", 
    label: "Nice to have", 
    color: "from-gray-500/20 to-slate-500/20",
    description: "Would be a nice addition"
  },
  { 
    priority: "medium", 
    label: "Would help", 
    color: "from-blue-500/20 to-indigo-500/20",
    description: "Would improve the experience"
  },
  { 
    priority: "high", 
    label: "Game changer", 
    color: "from-amber-500/20 to-orange-500/20",
    description: "Would transform how we work"
  }
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
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="rounded-xl p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
              Feature Request
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Share your ideas to help us build features that matter to you and your team.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          label="Feature Title"
          icon={<Target className="w-4 h-4" />}
          placeholder="What would you like to see?"
          value={formData.title}
          onChange={(e) => setFormData({ 
            ...formData, 
            title: (e.target as HTMLInputElement).value 
          })}
          required
        />

        {/* Priority Selector */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Priority Level
          </label>
          <div className="grid grid-cols-3 gap-3">
            {priorities.map(({ priority, label, color, description }) => (
              <button
                key={priority}
                type="button"
                onClick={() => setFormData({ ...formData, priority: priority as any })}
                className={`
                  flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all
                  ${formData.priority === priority
                    ? `border-primary bg-gradient-to-br ${color} text-foreground shadow-sm`
                    : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
                  }
                `}
              >
                <div className="text-xs font-bold uppercase tracking-wider">
                  {priority}
                </div>
                <div className="text-xs text-center leading-tight">
                  {label}
                </div>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {priorities.find(p => p.priority === formData.priority)?.description}
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Tell us more
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ 
              ...formData, 
              description: e.target.value 
            })}
            placeholder="How would this feature work? What problem would it solve?"
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
            disabled={isLoading || !formData.title.trim() || !formData.description.trim()}
            className="btn btn-primary flex-1"
          >
            {isLoading ? (
              <>
                <div className="spinner mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Submit Idea
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}