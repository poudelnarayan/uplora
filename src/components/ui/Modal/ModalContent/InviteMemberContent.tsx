"use client";

import { useState } from "react";
import { Mail, Shield, UserPlus } from "lucide-react";
import { TextField, SelectField } from "@/components/ui/TextField";

interface InviteMemberContentProps {
  teamName?: string;
  onSubmit: (email: string, role: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  currentUserEmail?: string;
}

export default function InviteMemberContent({ 
  teamName, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  currentUserEmail
}: InviteMemberContentProps) {
  const [formData, setFormData] = useState({
    email: "",
    role: "EDITOR" as "ADMIN" | "MANAGER" | "EDITOR"
  });
  const [error, setError] = useState<string>("");

  const isSelf = currentUserEmail
    ? formData.email.trim().toLowerCase() === currentUserEmail.toLowerCase()
    : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const email = formData.email.trim();
    if (!email) return;

    if (isSelf) {
      setError("You cannot invite yourself");
      return;
    }
    
    try {
      await onSubmit(email, formData.role);
      setFormData({ email: "", role: "EDITOR" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send invitation";
      setError(message);
    }
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
      <div className="rounded-xl p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-200/60">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'hsl(210, 40%, 25%)' }}>
              Email Invitation
            </p>
            <p className="text-xs" style={{ color: 'hsl(176, 20%, 16%)' }}>
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
            onChange={(e) => {
              setFormData({ 
                ...formData, 
                email: (e.target as HTMLInputElement).value 
              });
              if (currentUserEmail && (e.target as HTMLInputElement).value.trim().toLowerCase() === currentUserEmail.toLowerCase()) {
                setError("You cannot invite yourself");
              } else if (error) {
                setError("");
              }
            }}
            required
          />
          {error && (
            <p className="text-sm" style={{ color: '#ef4444' }} aria-live="polite">{error}</p>
          )}
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
          <div className="p-3 rounded-lg bg-gradient-to-r from-slate-50 to-blue-50/30 border border-slate-200/60">
            <div className="text-xs">
              <span className="font-medium" style={{ color: 'hsl(210, 40%, 25%)' }}>Role Permissions: </span>
              <span style={{ color: 'hsl(176, 20%, 16%)' }}>
                {getRoleDescription(formData.role)}
              </span>
            </div>
          </div>
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
            disabled={isLoading || !formData.email.trim() || isSelf}
            className="flex-1 px-4 py-2 rounded-lg text-white transition-all flex items-center justify-center gap-2 bg-[hsl(210,55%,45%)] hover:bg-[hsl(210,40%,25%)] disabled:opacity-60"
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