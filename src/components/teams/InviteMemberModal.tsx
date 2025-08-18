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
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Team Member" size="md">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Add someone to collaborate with your team</p>
          {inviting && (
            <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-secondary animate-pulse" />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info banner with proper light mode styling */}
          <div className="rounded-xl p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Email Invitation</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  They'll receive a secure invitation link to join your team. The link expires in 7 days.
                </p>
              </div>
            </div>
          </div>

          {/* Form fields */}
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
              <p className="text-xs text-muted-foreground">Make sure this email address is correct</p>
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
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <div className="text-xs">
                  <span className="font-medium text-foreground">Role Permissions:</span>
                  <span className="text-muted-foreground ml-1">
                  {invitation.role === "EDITOR" && " Can upload videos and collaborate on content creation."}
                  {invitation.role === "MANAGER" && " Can manage team members, approve content, and oversee projects."}
                  {invitation.role === "ADMIN" && " Has full access to team settings, billing, and member management."}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1"
              disabled={inviting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviting || !invitation.email.trim()}
              className="btn btn-primary flex-1"
            >
              {inviting ? (
                <>
                  <div className="spinner mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}