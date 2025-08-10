"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Users, 
  Crown, 
  UserCheck, 
  Edit3, 
  Mail, 
  Trash2, 
  Settings,
  X
} from "lucide-react";
import toast from "react-hot-toast";

interface Team {
  id: string;
  name: string;
  description: string;
  role: string;
  memberCount: number;
  createdAt: string;
}

interface TeamPanelProps {
  teams: Team[];
  onTeamsUpdate: () => void;
}

export default function TeamPanel({ teams, onTeamsUpdate }: TeamPanelProps) {
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [invitation, setInvitation] = useState({ email: "", role: "EDITOR" });
  const [loading, setLoading] = useState(false);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN": return <Crown className="w-4 h-4 text-yellow-400" />;
      case "MANAGER": return <UserCheck className="w-4 h-4 text-green-400" />;
      case "EDITOR": return <Edit3 className="w-4 h-4 text-blue-400" />;
      default: return <Edit3 className="w-4 h-4 text-blue-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "text-yellow-400";
      case "MANAGER": return "text-green-400";
      case "EDITOR": return "text-blue-400";
      default: return "text-blue-400";
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.name.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTeam),
      });

      if (response.ok) {
        toast.success("Team created successfully!");
        setNewTeam({ name: "", description: "" });
        setShowCreateTeam(false);
        onTeamsUpdate();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create team");
      }
    } catch (error) {
      toast.error("Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation.email.trim() || !selectedTeam) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${selectedTeam}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invitation),
      });

      if (response.ok) {
        toast.success("Invitation sent successfully!");
        setInvitation({ email: "", role: "EDITOR" });
        setShowInviteMember(false);
        setSelectedTeam(null);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to send invitation");
      }
    } catch (error) {
      toast.error("Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Team Management</h2>
          <p className="text-white/60">Manage your YouTube collaboration teams</p>
        </div>
        <button
          onClick={() => setShowCreateTeam(true)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" />
          Create Team
        </button>
      </div>

      {/* Teams Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {teams.map((team, index) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="card floating hover:glow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full glass flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{team.name}</h3>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(team.role)}
                      <span className={`text-sm font-medium ${getRoleColor(team.role)}`}>
                        {team.role}
                      </span>
                    </div>
                  </div>
                </div>
                {(team.role === "ADMIN" || team.role === "MANAGER") && (
                  <button className="w-8 h-8 rounded-full glass hover:glow transition-all flex items-center justify-center">
                    <Settings className="w-4 h-4 text-white/60" />
                  </button>
                )}
              </div>

              <p className="text-white/70 mb-4 line-clamp-2">{team.description}</p>

              <div className="flex items-center justify-between text-sm text-white/60 mb-4">
                <span>{team.memberCount} members</span>
                <span>{new Date(team.createdAt).toLocaleDateString()}</span>
              </div>

              {(team.role === "ADMIN" || team.role === "MANAGER") && (
                <button
                  onClick={() => {
                    setSelectedTeam(team.id);
                    setShowInviteMember(true);
                  }}
                  className="btn btn-secondary w-full"
                >
                  <Mail className="w-4 h-4" />
                  Invite Member
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 rounded-full glass mx-auto mb-6 flex items-center justify-center">
            <Users className="w-12 h-12 text-white/40" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No teams yet</h3>
          <p className="text-white/60 mb-6">Create your first team to start collaborating</p>
          <button
            onClick={() => setShowCreateTeam(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5" />
            Create Your First Team
          </button>
        </div>
      )}

      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreateTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Create New Team</h3>
                <button
                  onClick={() => setShowCreateTeam(false)}
                  className="w-8 h-8 rounded-full glass hover:glow-red transition-all flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    className="input"
                    placeholder="Content Creators"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    className="input resize-none h-24"
                    placeholder="Describe your team's purpose..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateTeam(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !newTeam.name.trim()}
                    className="btn btn-primary flex-1"
                  >
                    {loading ? <div className="spinner" /> : "Create Team"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Member Modal */}
      <AnimatePresence>
        {showInviteMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Invite Team Member</h3>
                <button
                  onClick={() => {
                    setShowInviteMember(false);
                    setSelectedTeam(null);
                  }}
                  className="w-8 h-8 rounded-full glass hover:glow-red transition-all flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              <form onSubmit={handleInviteMember} className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={invitation.email}
                    onChange={(e) => setInvitation({ ...invitation, email: e.target.value })}
                    className="input"
                    placeholder="colleague@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Role
                  </label>
                  <select
                    value={invitation.role}
                    onChange={(e) => setInvitation({ ...invitation, role: e.target.value })}
                    className="input"
                  >
                    <option value="EDITOR">Editor - Can upload videos</option>
                    <option value="MANAGER">Manager - Can invite members</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteMember(false);
                      setSelectedTeam(null);
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !invitation.email.trim()}
                    className="btn btn-success flex-1"
                  >
                    {loading ? <div className="spinner" /> : "Send Invite"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
