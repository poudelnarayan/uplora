"use client";

import { useState } from "react";
import { Sparkles, Lightbulb, Target } from "lucide-react";
import { TextField } from "@/app/components/ui/TextField";

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
      <div className="rounded-xl p-4 bg-gradient-to-r from-amber-50 to-yellow-50/50 border border-amber-200/60">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'hsl(210, 40%, 25%)' }}>
              Feature Request
            </p>
            <p className="text-xs" style={{ color: 'hsl(176, 20%, 16%)' }}>
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
          <label className="text-sm font-medium" style={{ color: 'hsl(210, 40%, 25%)' }}>
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
                    ? `border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-sm`
                    : "border-slate-200 bg-slate-50/50 hover:border-amber-300 hover:bg-amber-50/30"
                  }
                `}
                style={{ 
                  color: formData.priority === priority ? 'hsl(210, 40%, 25%)' : 'hsl(176, 20%, 16%)'
                }}
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
          <p className="text-xs" style={{ color: 'hsl(176, 20%, 16%)' }}>
            {priorities.find(p => p.priority === formData.priority)?.description}
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium" style={{ color: 'hsl(210, 40%, 25%)' }}>
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
              w-full min-h-[120px] p-3 rounded-lg border border-slate-200 
              bg-slate-50/50 placeholder:opacity-60
              focus:border-amber-400 focus:ring-2 focus:ring-amber-200/50
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
            disabled={isLoading || !formData.title.trim() || !formData.description.trim()}
            className="flex-1 px-4 py-2 rounded-lg text-white transition-all flex items-center justify-center gap-2 hover:shadow-lg"
            style={{ backgroundColor: 'hsl(210, 55%, 45%)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(210, 40%, 25%)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'hsl(210, 55%, 45%)'}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Submit Idea
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}