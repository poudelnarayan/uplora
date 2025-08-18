"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { TextField } from "@/components/ui/TextField";

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => Promise<void>;
}

export default function CreateTeamModal({ isOpen, onClose, onSubmit }: CreateTeamModalProps) {
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(newTeam.name, newTeam.description);
    setNewTeam({ name: "", description: "" });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Team" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <TextField
          label="Team Name"
          icon={<Users className="w-4 h-4" />}
          placeholder="Content Creators"
          value={newTeam.name}
          onChange={(e) => setNewTeam({ ...newTeam, name: (e.target as HTMLInputElement).value })}
          required
        />

        <TextField
          label="Description"
          value={newTeam.description}
          onChange={(e) => setNewTeam({ ...newTeam, description: (e.target as HTMLTextAreaElement).value })}
          placeholder="Describe your team's purpose and goals..."
          multiline
        />

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button type="submit" disabled={!newTeam.name.trim()} className="btn btn-primary flex-1">
            Create Team
          </button>
        </div>
      </form>
    </Modal>
  );
}