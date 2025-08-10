"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { redirect } from "next/navigation";
import { 
  Upload, 
  Users, 
  Youtube, 
  Plus, 
  Crown, 
  UserCheck, 
  Edit3,
  LogOut,
  FileVideo,
  X,
  CheckCircle,
  Mail
} from "lucide-react";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<"upload" | "team">("upload");
  const [userTeams, setUserTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [s3Key, setS3Key] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [videoTitle, setVideoTitle] = useState("My Awesome Video");
  const [videoDescription, setVideoDescription] = useState("Uploaded with YTUploader");

  // Team state
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });
  const [invitation, setInvitation] = useState({ email: "", role: "EDITOR" });

  useEffect(() => {
    if (session) {
      fetchUserTeams();
    }
  }, [session]);

  const fetchUserTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      if (response.ok) {
        const teams = await response.json();
        setUserTeams(teams);
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!session) {
    redirect("/");
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  // Upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const videoFile = droppedFiles.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      setFile(videoFile);
    } else {
      toast.error("Please drop a video file");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      const presign = await fetch("/api/s3/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      }).then((r) => r.json());

      setUploadProgress(30);

      const putRes = await fetch(presign.url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      setUploadProgress(80);

      if (!putRes.ok) {
        const fallback = await fetch(
          `/api/s3/upload?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`,
          { method: "POST", body: file }
        ).then((r) => r.json());
        setS3Key(fallback.key);
        setUploadProgress(100);
        toast.success("File uploaded successfully!");
        return;
      }

      setS3Key(presign.key);
      setUploadProgress(100);
      toast.success("File uploaded successfully!");
    } catch (error) {
      toast.error("Upload failed. Please try again.");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!s3Key) return;
    
    setIsPublishing(true);
    
    try {
      const response = await fetch("/api/youtube/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          key: s3Key, 
          title: videoTitle, 
          description: videoDescription, 
          privacyStatus: "private" 
        }),
      });

      const result = await response.json();

      if (result.id) {
        toast.success(`Video published to YouTube! ID: ${result.id}`);
        // Reset form
        setFile(null);
        setS3Key("");
        setUploadProgress(0);
        setVideoTitle("My Awesome Video");
        setVideoDescription("Uploaded with YTUploader");
      } else {
        toast.error(result.error || "Failed to publish video");
      }
    } catch (error) {
      toast.error("Failed to publish video");
    } finally {
      setIsPublishing(false);
    }
  };

  // Team handlers
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
        fetchUserTeams();
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN": return <Crown className="w-4 h-4 text-yellow-400" />;
      case "MANAGER": return <UserCheck className="w-4 h-4 text-green-400" />;
      case "EDITOR": return <Edit3 className="w-4 h-4 text-blue-400" />;
      default: return <Edit3 className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full glass glow flex items-center justify-center">
              <Youtube className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome back, {session.user?.name}
              </h1>
              <p className="text-white/60">Manage your YouTube team workflow</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white/60">
              <div className="w-8 h-8 rounded-full glass flex items-center justify-center">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                    {session.user?.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              <span className="text-sm">{session.user?.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="btn btn-secondary"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-4 mb-8"
        >
          <button
            onClick={() => setActiveTab("upload")}
            className={`btn ${
              activeTab === "upload" ? "btn-primary" : "btn-secondary"
            }`}
          >
            <Upload className="w-5 h-5" />
            Upload Center
          </button>
          <button
            onClick={() => setActiveTab("team")}
            className={`btn ${
              activeTab === "team" ? "btn-primary" : "btn-secondary"
            }`}
          >
            <Users className="w-5 h-5" />
            Team Management
          </button>
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "upload" ? (
            // Upload Zone
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Upload Section */}
              <div className="card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full glass glow flex items-center justify-center">
                    <Upload className="w-6 h-6 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Upload Video</h2>
                </div>

                {!file ? (
                  <div
                    className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
                      isDragOver
                        ? 'border-blue-400 bg-blue-500/10 glow'
                        : 'border-white/30 hover:border-white/50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <input
                      id="file-input"
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        if (selectedFile) setFile(selectedFile);
                      }}
                      className="hidden"
                    />
                    
                    <div className="space-y-4">
                      <div className="w-20 h-20 rounded-full glass mx-auto flex items-center justify-center">
                        <FileVideo className="w-10 h-10 text-white/60" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          Drop your video here
                        </h3>
                        <p className="text-white/60">
                          or click to browse your files
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {['MP4', 'MOV', 'AVI', 'WebM'].map(format => (
                          <span
                            key={format}
                            className="px-3 py-1 rounded-full glass text-sm text-white/80"
                          >
                            {format}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="glass rounded-xl p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl glass glow-green flex items-center justify-center">
                          <FileVideo className="w-8 h-8 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-lg truncate">
                            {file.name}
                          </h3>
                          <p className="text-white/60">
                            {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
                          </p>
                        </div>
                        {!isUploading && (
                          <button
                            onClick={() => setFile(null)}
                            className="w-10 h-10 rounded-full glass hover:glow-red transition-all flex items-center justify-center"
                          >
                            <X className="w-5 h-5 text-white/60" />
                          </button>
                        )}
                      </div>

                      {isUploading && (
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-white/80">Uploading...</span>
                            <span className="text-white/80">{uploadProgress}%</span>
                          </div>
                          <div className="w-full h-2 glass rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {!s3Key && (
                      <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="btn btn-primary w-full"
                      >
                        {isUploading ? (
                          <>
                            <div className="spinner" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            Upload to S3
                          </>
                        )}
                      </button>
                    )}

                    {s3Key && (
                      <div className="glass glow-green rounded-xl p-4 flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        <div>
                          <p className="text-white font-semibold">Upload Complete!</p>
                          <p className="text-white/60 text-sm">Ready to publish to YouTube</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Publish Section */}
              <div className="card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full glass glow-red flex items-center justify-center">
                    <Youtube className="w-6 h-6 text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Publish to YouTube</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Video Title
                    </label>
                    <input
                      type="text"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      className="input"
                      placeholder="Enter video title..."
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={videoDescription}
                      onChange={(e) => setVideoDescription(e.target.value)}
                      className="input resize-none h-32"
                      placeholder="Enter video description..."
                    />
                  </div>

                  <button
                    onClick={handlePublish}
                    disabled={!s3Key || isPublishing}
                    className={`btn w-full ${
                      s3Key ? "btn-success" : "btn-secondary opacity-50 cursor-not-allowed"
                    }`}
                  >
                    {isPublishing ? (
                      <>
                        <div className="spinner" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Youtube className="w-5 h-5" />
                        Publish to YouTube
                      </>
                    )}
                  </button>

                  {!s3Key && (
                    <p className="text-white/60 text-sm text-center">
                      Upload a video first to enable publishing
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Team Management
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
                {userTeams.map((team: {
                  id: string;
                  name: string;
                  description: string;
                  role: string;
                  memberCount: number;
                  createdAt: string;
                }, index) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
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
                            <span className="text-sm font-medium text-white/80">
                              {team.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-white/70 mb-4">{team.description}</p>

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
              </div>

              {userTeams.length === 0 && (
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
            </div>
          )}
        </motion.div>

        {/* Create Team Modal */}
        {showCreateTeam && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
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
          </div>
        )}

        {/* Invite Member Modal */}
        {showInviteMember && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
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
          </div>
        )}
      </div>
    </div>
  );
}
