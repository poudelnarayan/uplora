"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Mail, Percent, CheckCircle2, Hourglass, TrendingUp } from "lucide-react";
import AppShell from "@/components/layout/AppShell";

type TeamSummary = { id: string; name: string };

type TeamDetails = {
  team: { id: string; name: string; description?: string; createdAt: string };
  members: { id: string; role: "OWNER" | "ADMIN" | "MANAGER" | "EDITOR"; joinedAt: string; user: { id: string; name: string | null; email: string; image?: string | null } }[];
  invites: { id: string; email: string; role: "ADMIN" | "MANAGER" | "EDITOR"; status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED"; createdAt: string; expiresAt: string }[];
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<TeamDetails | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // get user's team
        const tRes = await fetch("/api/teams");
        if (!tRes.ok) { setLoading(false); return; }
        const teams: TeamSummary[] = await tRes.json();
        if (!teams.length) { setLoading(false); return; }

        // fetch details of first team (single team by design)
        const dRes = await fetch(`/api/teams/${teams[0].id}/details`);
        if (!dRes.ok) { setLoading(false); return; }
        const data: TeamDetails = await dRes.json();
        setDetails(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const membersCount = details?.members.length ?? 0;
  const invitesTotal = details?.invites.length ?? 0;
  const pendingInvites = details?.invites.filter(i => i.status === "PENDING").length ?? 0;
  const acceptedInvites = details?.invites.filter(i => i.status === "ACCEPTED").length ?? 0;
  const acceptanceRate = invitesTotal ? Math.round((acceptedInvites / invitesTotal) * 100) : 0;
  const avgJoinDays = (() => {
    if (!details) return 0;
    const ownerDate = new Date(details.team.createdAt).getTime();
    const deltas = details.members.map(m => (new Date(m.joinedAt).getTime() - ownerDate) / (1000*60*60*24));
    const positives = deltas.filter(d => d >= 0);
    if (!positives.length) return 0;
    return Math.round(positives.reduce((a,b)=>a+b,0)/positives.length);
  })();

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="text-center">
            <h1 className="heading-2 mb-2">Team Insights</h1>
            <p className="text-muted-foreground">App analytics about your team members and invitations</p>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <div className="spinner-lg mx-auto mb-4" />
            <p className="text-muted-foreground">Loading insights...</p>
          </div>
        ) : !details ? (
          <div className="card p-10 text-center">
            <p className="text-muted-foreground">No team data yet. Create a team and invite members to see insights.</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center"><Users className="w-6 h-6 text-blue-500" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Members</p>
                    <p className="text-2xl font-bold text-foreground">{membersCount}</p>
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center"><Mail className="w-6 h-6 text-yellow-500" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Invites</p>
                    <p className="text-2xl font-bold text-foreground">{pendingInvites}</p>
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-green-500" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Accepted Invites</p>
                    <p className="text-2xl font-bold text-foreground">{acceptedInvites}</p>
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center"><Percent className="w-6 h-6 text-purple-500" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Acceptance Rate</p>
                    <p className="text-2xl font-bold text-foreground">{acceptanceRate}%</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Operational Insights */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Hourglass className="w-5 h-5 text-blue-500" />Average Join Time</h3>
                <p className="text-3xl font-bold text-foreground">{avgJoinDays} days</p>
                <p className="text-sm text-muted-foreground mt-2">Average time from team creation to members joining.</p>
              </div>

              <div className="card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-500" />Recent Invitations</h3>
                <div className="space-y-3">
                  {details.invites.slice(0,5).map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded bg-muted/50">
                      <div>
                        <p className="text-sm font-medium text-foreground">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">{inv.role.toLowerCase()} • {new Date(inv.createdAt).toLocaleString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${inv.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : inv.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>{inv.status.toLowerCase()}</span>
                    </div>
                  ))}
                  {details.invites.length === 0 && <p className="text-sm text-muted-foreground">No invitations yet.</p>}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </AppShell>
  );
}
