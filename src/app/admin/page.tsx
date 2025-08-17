"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Shield, 
  Trash2, 
  AlertTriangle, 
  Search, 
  Filter,
  Eye,
  UserX,
  Building,
  Video,
  RefreshCw
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/components/ui/Notification";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  ownedTeams: Team[];
  teamMembers: TeamMember[];
  videos: Video[];
}

interface Team {
  id: string;
  name: string;
  memberCount: number;
  inviteCount: number;
}

interface TeamMember {
  team: Team;
  role: string;
}

interface Video {
  id: string;
  filename: string;
  status: string;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const notifications = useNotifications();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is admin
    const checkAdminStatus = async () => {
      try {
        const response = await fetch("/api/admin/check");
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin);
          if (!data.isAdmin) {
            router.push("/dashboard");
            notifications.addNotification({
              type: "error",
              title: "Access Denied",
              message: "You don't have admin privileges."
            });
          }
        } else {
          router.push("/dashboard");
        }
      } catch (error) {
        router.push("/dashboard");
      }
    };

    if (session?.user?.id) {
      checkAdminStatus();
    }
  }, [session, router, notifications]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchTeams();
      fetchVideos();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const transformedUsers = (data.users as any[]).map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        ownedTeams: user.ownedTeams,
        teamMembers: user.teamMembers,
        videos: user.videos,
        emailVerified: user.emailVerified,
        ownedTeamsCount: Array.isArray(user.ownedTeams) ? user.ownedTeams.length : 0,
        teamMembersCount: Array.isArray(user.teamMembers) ? user.teamMembers.length : 0,
        videosCount: Array.isArray(user.videos) ? user.videos.length : 0,
      }));
      
      setUsers(transformedUsers);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch users";
      notifications.addNotification({
        type: "error",
        title: "Failed to Load Users",
        message: errorMessage
      });
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/admin/teams");
      if (!response.ok) return;
      const data = await response.json();
      setTeams(data.teams || []);
    } catch {}
  };

  const fetchVideos = async () => {
    try {
      const response = await fetch("/api/admin/videos");
      if (!response.ok) return;
      const data = await response.json();
      setVideos(data.videos || []);
    } catch {}
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Success case
        notifications.addNotification({
          type: "success",
          title: "User Deleted Successfully",
          message: `${selectedUser.email} has been permanently deleted.`
        });

        // Show warnings if any
        if (result.warnings && result.warnings.length > 0) {
          notifications.addNotification({
            type: "warning",
            title: "Partial Cleanup",
            message: `User deleted but some S3 files may need manual cleanup. Check logs for details.`
          });
        }

        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsers(); // Refresh the list
      } else if (response.status === 500 && result.rollbackSuccessful) {
        // Rollback successful
        notifications.addNotification({
          type: "warning",
          title: "Deletion Rolled Back",
          message: "User deletion failed but all changes were safely rolled back. No data was lost."
        });
        setShowDeleteModal(false);
        setSelectedUser(null);
      } else if (response.status === 500 && result.rollbackSuccessful === false) {
        // Rollback failed - critical error
        notifications.addNotification({
          type: "error",
          title: "Critical Error",
          message: "User deletion failed and rollback was unsuccessful. Manual intervention required. Contact system administrator."
        });
        console.error("Critical deletion error:", result);
      } else {
        // Other errors
        notifications.addNotification({
          type: "error",
          title: "Delete Failed",
          message: result.error || result.message || "Failed to delete user."
        });
      }
    } catch (error) {
      notifications.addNotification({
        type: "error",
        title: "Network Error",
        message: "Failed to connect to server. Please check your internet connection and try again."
      });
      console.error("Network error during user deletion:", error);
      setDeleteError("Network connection failed. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <NextSeoNoSSR title="Admin Dashboard" noindex nofollow />
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="heading-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, teams, and system settings</p>
          </div>
          <button
            onClick={fetchUsers}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <Building className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{teams.length}</p>
                <p className="text-sm text-muted-foreground">Total Teams</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <Video className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{videos.length}</p>
                <p className="text-sm text-muted-foreground">Total Videos</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">Admin</p>
                <p className="text-sm text-muted-foreground">Access Level</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <button className="btn btn-outline flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card overflow-hidden"
        >
          {loading ? (
            <div className="p-8 text-center">
              <div className="spinner mx-auto mb-4" />
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">User</th>
                    <th className="text-left p-4 font-medium">Teams Owned</th>
                    <th className="text-left p-4 font-medium">Teams Member</th>
                    <th className="text-left p-4 font-medium">Videos</th>
                    <th className="text-left p-4 font-medium">Joined</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr key={user.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{user.name || "No name"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="badge badge-secondary">
                          {user.ownedTeamsCount || 0} teams
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="badge badge-outline">
                          {user.teamMembersCount || 0} teams
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="badge badge-outline">
                          {user.videosCount || 0} videos
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDetailsModal(true);
                            }}
                            className="btn btn-ghost btn-sm"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteModal(true);
                            }}
                            className="btn btn-ghost btn-sm text-red-500 hover:text-red-700"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold">User Details</h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn btn-ghost btn-sm"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="font-semibold mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedUser.name || "No name"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-mono text-sm">{selectedUser.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email Verified</p>
                    <p className="font-medium">
                      <span className={`badge ${selectedUser.emailVerified ? 'badge-success' : 'badge-warning'}`}>
                        {selectedUser.emailVerified ? "Yes" : "No"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h4 className="font-semibold mb-3">Statistics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="card p-3 text-center">
                    <p className="text-2xl font-bold text-blue-500">{selectedUser.ownedTeamsCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Teams Owned</p>
                  </div>
                  <div className="card p-3 text-center">
                    <p className="text-2xl font-bold text-green-500">{selectedUser.teamMembersCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Team Memberships</p>
                  </div>
                  <div className="card p-3 text-center">
                    <p className="text-2xl font-bold text-purple-500">{selectedUser.videosCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Videos</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowDeleteModal(true);
                  }}
                  className="btn btn-destructive flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold">Delete User Account</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to permanently delete <strong>{selectedUser.email}</strong>?
              </p>
              
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>This action will:</strong>
                </p>
                <ul className="text-sm text-red-600 dark:text-red-400 mt-1 space-y-1">
                  <li>• Delete the user account permanently</li>
                  <li>• Remove user from all teams</li>
                  <li>• Delete all teams owned by this user</li>
                  <li>• Delete all videos owned by this user</li>
                  <li>• Delete all video files from Amazon S3</li>
                  <li>• Delete all video thumbnails from S3</li>
                  <li>• Force user to re-register if they try to sign in</li>
                </ul>
              </div>
              
              {deleteError && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="btn btn-destructive flex-1 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="spinner w-4 h-4" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Permanently"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
