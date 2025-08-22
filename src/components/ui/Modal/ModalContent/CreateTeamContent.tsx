"use client";

import { useState } from "react";
import { Users, FileText, Plus } from "lucide-react";
import { TextField } from "@/components/ui/TextField";

interface CreateTeamContentProps {
  onSubmit: (name: string, description: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function CreateTeamContent({ 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: CreateTeamContentProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    await onSubmit(formData.name.trim(), formData.description.trim());
    setFormData({ name: "", description: "" });
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="rounded-xl p-4 bg-[#DBE2EF] border border-[#3F72AF]">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#3F72AF] flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#112D4E] mb-1">
              Team Collaboration
            </p>
            <p className="text-xs text-[#3F72AF]">
              Create a workspace where your team can upload, review, and publish content together.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          label="Team Name"
          icon={<Users className="w-4 h-4" />}
          placeholder="Content Creators"
          value={formData.name}
          onChange={(e) => setFormData({ 
            ...formData, 
            name: (e.target as HTMLInputElement).value 
          })}
          required
        />

        <TextField
          label="Description (Optional)"
          icon={<FileText className="w-4 h-4" />}
          placeholder="Describe your team's purpose and goals..."
          value={formData.description}
          onChange={(e) => setFormData({ 
            ...formData, 
            description: (e.target as HTMLTextAreaElement).value 
          })}
          multiline
        />

        {/* Team Templates */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-[#112D4E]">Quick Templates</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({
                name: "Content Creation Team",
                description: "Team for video production and content strategy"
              })}
              className="p-3 text-left rounded-lg border border-[#DBE2EF] hover:border-[#3F72AF] hover:bg-[#DBE2EF] transition-all"
            >
              <p className="text-sm font-medium text-[#112D4E]">Content Team</p>
              <p className="text-xs text-[#3F72AF]">Video production & strategy</p>
            </button>
            <button
              type="button"
              onClick={() => setFormData({
                name: "Marketing Team",
                description: "Team for social media and marketing coordination"
              })}
              className="p-3 text-left rounded-lg border border-[#DBE2EF] hover:border-[#3F72AF] hover:bg-[#DBE2EF] transition-all"
            >
              <p className="text-sm font-medium text-[#112D4E]">Marketing Team</p>
              <p className="text-xs text-[#3F72AF]">Social media & marketing</p>
            </button>
          </div>
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
            disabled={isLoading || !formData.name.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-[#3F72AF] text-white hover:bg-[#112D4E] transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Team
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}