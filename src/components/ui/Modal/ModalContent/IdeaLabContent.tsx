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
      <div className="rounded-xl p-4 bg-[#DBE2EF] border border-[#3F72AF]">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#3F72AF] flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#112D4E] mb-1">
              Feature Request
            </p>
            <p className="text-xs text-[#3F72AF]">
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
          <label className="text-sm font-medium text-[#112D4E]">
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
                    ? `border-[#3F72AF] bg-[#DBE2EF] text-[#112D4E] shadow-sm`
                    : "border-[#DBE2EF] bg-[#F9F7F7] text-[#3F72AF] hover:border-[#3F72AF] hover:bg-[#DBE2EF]"
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
          <p className="text-xs text-[#3F72AF]">
            {priorities.find(p => p.priority === formData.priority)?.description}
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#112D4E]">
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
              w-full min-h-[120px] p-3 rounded-lg border border-[#DBE2EF] 
              bg-[#F9F7F7] text-[#112D4E] placeholder:text-[#3F72AF]
              focus:border-[#3F72AF] focus:ring-2 focus:ring-[#3F72AF]/20
              transition-all resize-vertical
            "
            required
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-[#DBE2EF]">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-[#DBE2EF] text-[#3F72AF] hover:bg-[#DBE2EF] transition-all"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !formData.title.trim() || !formData.description.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-[#3F72AF] text-white hover:bg-[#112D4E] transition-all flex items-center justify-center gap-2"
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