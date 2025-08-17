"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Users, RefreshCw, AlertTriangle } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useSession } from "next-auth/react";
import { NextSeoNoSSR } from "@/components/seo/NoSSRSeo";

export default function AdminDebugPage() {
  const { data: session } = useSession();
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/debug/admin-test");
      const data = await response.json();
      
      if (response.ok) {
        setAdminData(data);
      } else {
        setError(data.error || "Failed to fetch admin data");
      }
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchAdminData();
    }
  }, [session]);

  if (!session) {
    return (
      <AppShell>
        <div className="text-center p-8">
          <div className="spinner mx-auto mb-4" />
          <p>Loading session...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <NextSeoNoSSR title="Admin Debug" noindex nofollow />
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="heading-2">Admin Debug Dashboard</h1>
            <p className="text-muted-foreground">Raw admin data for troubleshooting</p>
          </div>
          <button
            onClick={fetchAdminData}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </motion.div>

        {/* Current User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold">Current User</h3>
          </div>
          <div className="space-y-2">
            <p><strong>Email:</strong> {session.user.email}</p>
            <p><strong>Name:</strong> {session.user.name}</p>
            <p><strong>ID:</strong> {session.user.id}</p>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-8 text-center"
          >
            <div className="spinner mx-auto mb-4" />
            <p>Loading admin data...</p>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-6 border-red-200 bg-red-50 dark:bg-red-900/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Error</h3>
            </div>
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <div className="mt-4">
              <p className="text-sm text-red-500 dark:text-red-400">
                <strong>Possible causes:</strong>
              </p>
              <ul className="text-sm text-red-500 dark:text-red-400 mt-2 space-y-1">
                <li>• Your email is not in the admin list</li>
                <li>• Database connection issues</li>
                <li>• Authentication problems</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* Admin Data */}
        {adminData && !loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{adminData.userCount}</p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{adminData.isAdmin ? "Yes" : "No"}</p>
                    <p className="text-sm text-muted-foreground">Admin Access</p>
                  </div>
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">{adminData.timestamp}</p>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                  </div>
                </div>
              </div>
            </div>

            {/* All Users Table */}
            <div className="card overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">All Users ({adminData.allUsers.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">User</th>
                      <th className="text-left p-4 font-medium">Teams Owned</th>
                      <th className="text-left p-4 font-medium">Teams Member</th>
                      <th className="text-left p-4 font-medium">Videos</th>
                      <th className="text-left p-4 font-medium">Joined</th>
                      <th className="text-left p-4 font-medium">Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminData.allUsers.map((user: any, index: number) => (
                      <tr key={user.id} className="border-t border-border hover:bg-muted/30">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{user.name || "No name"}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="badge badge-secondary">
                            {user.ownedTeams} teams
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="badge badge-outline">
                            {user.teamMembers} teams
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="badge badge-outline">
                            {user.videos} videos
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span className={`badge ${user.emailVerified ? 'badge-success' : 'badge-warning'}`}>
                            {user.emailVerified ? "Yes" : "No"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Raw Data */}
            <div className="card">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold">Raw API Response</h3>
              </div>
              <div className="p-6">
                <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-96">
                  {JSON.stringify(adminData, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
