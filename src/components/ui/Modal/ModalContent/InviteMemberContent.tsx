"use client";

import { useState } from "react";
import { Mail, Shield, UserPlus } from "lucide-react";
import { TextField, SelectField } from "@/components/ui/TextField";

interface InviteMemberContentProps {
  teamName?: string;
  onSubmit: (email: string, role: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function InviteMemberContent({ 
  teamName, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: InviteMemberContentProps) {
  const [formData, setFormData] = useState({
    email: "",
    role: "EDITOR" as "ADMIN" | "MANAGER" | "EDITOR"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) return;
    
    await onSubmit(formData.email.trim(), formData.role);
    setFormData({ email: "", role: "EDITOR" });
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "EDITOR": return "Can upload videos and collaborate on content creation";
      case "MANAGER": return "Can manage team members, approve content, and oversee projects";
      case "ADMIN": return "Has full access to team settings, billing, and member management";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="rounded-xl p-4 bg-[#DBE2EF] border border-[#3F72AF]">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#3F72AF] flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#112D4E] mb-1">
              Email Invitation
            </p>
            <p className="text-xs text-[#3F72AF]">
              They'll receive a secure invitation link to join {teamName || "your team"}. 
              The link expires in 7 days.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <TextField
            label="Email Address"
            icon={<Mail className="w-4 h-4" />}
            type="email"
            placeholder="colleague@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ 
              ...formData, 
              email: (e.target as HTMLInputElement).value 
            })}
            required
          />
          <p className="text-xs text-muted-foreground">
            Make sure this email address is correct
          </p>
          <p className="text-xs text-[#3F72AF]">
            Make sure this email address is correct
          </p>
        </div>

        <div className="space-y-3">
          <SelectField
            label="Team Role"
            icon={<Shield className="w-4 h-4" />}
            value={formData.role}
            onChange={(e) => setFormData({ 
              ...formData, 
              role: (e.target as HTMLSelectElement).value as any 
            })}
          >
            <option value="EDITOR">Editor</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </SelectField>

          {/* Role Description */}
          <div className="p-3 rounded-lg bg-[#DBE2EF] border border-[#3F72AF]">
            <div className="text-xs">
              <span className="font-medium text-[#112D4E]">Role Permissions: </span>
              <span className="text-[#3F72AF]">
                {getRoleDescription(formData.role)}
              </span>
            </div>
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
            disabled={isLoading || !formData.email.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-[#3F72AF] text-white hover:bg-[#112D4E] transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Send Invitation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}