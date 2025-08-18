"use client";

import { useState } from "react";
import { Users, Mail, Shield, UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { TextField, SelectField } from "@/components/ui/TextField";

interface Team {
  id: string;
  name: string;
  description: string;
}

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  onSubmit: (email: string, role: string) => Promise<void>;
  inviting: boolean;
}

export default function InviteMemberModal({ 
  isOpen, 
  onClose, 
  team, 
  onSubmit, 
  inviting 
}: InviteMemberModalProps) {
  const [invitation, setInvitation] = useState({
    email: "",
    role: "EDITOR" as "ADMIN" | "MANAGER" | "EDITOR"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(invitation.email, invitation.role);
    setInvitation({ email: "", role: "EDITOR" });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="md">
      <div className="relative">
        {/* Header with gradient background */}
        <div className="relative mb-6 -mx-6 -mt-6 p-6 rounded-t-lg bg-white dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center border border-primary/20 dark:border-primary/30">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Invite Team Member</h3>
                <p className="text-sm text-muted-foreground">Add someone to collaborate with your team</p>
              </div>
            </div>
          </div>
          {inviting && <div className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-gradient-to-r from-primary via-secondary to-primary animate-pulse" />}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info banner */}
          <div className="rounded-xl p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Email Invitation</p>
                <p className="text-xs text-muted-foreground">
                  They'll receive a secure invitation link to join your team. The link expires in 7 days.
                </p>
              </div>
            </div>
          </div>

          {/* Form fields with enhanced styling */}
          <div className="space-y-5">
            <div className="space-y-2">
              <TextField
                label="Email Address"
                icon={<Mail className="w-4 h-4" />}
                type="email"
                placeholder="colleague@example.com"
                value={invitation.email}
                onChange={(e) => setInvitation({ ...invitation, email: (e.target as HTMLInputElement).value })}
                required
              />
              <p className="text-xs text-muted-foreground ml-1">Make sure this email address is correct</p>
            </div>

            <div className="space-y-3">
              <SelectField
                label="Team Role"
                icon={<Shield className="w-4 h-4" />}
                value={invitation.role}
                onChange={(e) => setInvitation({ ...invitation, role: (e.target as HTMLSelectElement).value as any })}
              >
                <option value="EDITOR">Editor</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </SelectField>

              {/* Role descriptions */}
              <div className="grid grid-cols-1 gap-2 p-3 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Role Permissions:</span>
                  {invitation.role === "EDITOR" && " Can upload videos and collaborate on content creation."}
                  {invitation.role === "MANAGER" && " Can manage team members, approve content, and oversee projects."}
                  {invitation.role === "ADMIN" && " Has full access to team settings, billing, and member management."}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons with enhanced styling */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-600">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-ghost flex-1 hover:bg-muted/60 transition-colors"
              disabled={inviting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={inviting || !invitation.email.trim()} 
              className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-200"
            >
              {inviting ? (
                <>
                  <div className="spinner mr-2" /> Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" /> Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}