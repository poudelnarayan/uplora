"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, SignInButton, SignOutButton, useClerk } from "@clerk/nextjs";
import { Users, Crown, UserCheck, Edit3, CheckCircle, X, AlertTriangle, Calendar, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { useNotifications } from "@/app/components/ui/Notification";

interface Invitation {
  id: string;
  email: string;
  role: string;
  team: {
    name: string;
    description: string;
  };
  inviter: {
    name: string;
    email: string;
  };
  expiresAt: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const notifications = useNotifications();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.token) {
      fetchInvitation(params.token as string);
    }
  }, [params.token]);

  const fetchInvitation = async (token: string) => {
    try {
      const response = await fetch(`/api/invitations/${token}`);
      
      if (response.ok) {
        const result = await response.json();
        // API returns { ok: true, ...payload }
        setInvitation(result?.ok ? result : null);
      } else {
        const error = await response.json();
        setError(error.message || "Invitation not found or expired");
      }
    } catch (error) {
      setError("Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!invitation || !user) return;

    setAccepting(true);
    try {
      const response = await fetch(`/api/invitations/${params.token}/accept`, {
        method: "POST",
      });

      if (response.ok) {
        notifications.addNotification({ type: "success", title: "Welcome!", message: "You’ve joined the team." });
        router.push("/teams?refresh=1");
      } else {
        const error = await response.json();
        notifications.addNotification({ type: "error", title: "Invite failed", message: error.message || "Failed to accept invitation" });
      }
    } catch (error) {
      notifications.addNotification({ type: "error", title: "Invite failed", message: "Failed to accept invitation" });
    } finally {
      setAccepting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN": return <Crown className="h-5 w-5 text-yellow-500" />;
      case "MANAGER": return <UserCheck className="h-5 w-5 text-emerald-600" />;
      case "EDITOR": return <Edit3 className="h-5 w-5 text-blue-600" />;
      default: return <Edit3 className="h-5 w-5 text-blue-600" />;
    }
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case "ADMIN": return "Admin";
      case "MANAGER": return "Manager";
      case "EDITOR": return "Editor";
      default: return role;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "ADMIN": return "Full team management plus publishing permissions.";
      case "MANAGER": return "Can manage members and publishing workflows.";
      case "EDITOR": return "Can create and manage content for the team.";
      default: return "Team member";
    }
  };

  const invitePath = useMemo(() => `/invite/${params.token as string}`, [params.token]);
  const signedInEmail = (user?.emailAddresses?.[0]?.emailAddress || "").trim().toLowerCase();
  const inviteEmail = (invitation?.email || "").trim().toLowerCase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-lg">Loading invitation…</CardTitle>
            <CardDescription>One moment while we verify your invite.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Invitation not valid
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/")}>Back to Home</Button>
            <Button onClick={() => router.push("/teams")}>Go to Teams</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const handleSwitchAccount = async () => {
    openSignIn({ redirectUrl: invitePath });
  };

  const expiresText = invitation.expiresAt ? new Date(invitation.expiresAt).toLocaleString() : "Unknown";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                You’ve been invited to join a team
              </CardTitle>
              <CardDescription>
                Accept the invitation to start collaborating in Uplora.
              </CardDescription>
            </div>
            <Badge variant="outline" className="flex items-center gap-2">
              {getRoleIcon(invitation.role)}
              {roleLabel(invitation.role)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4">
            <div className="flex flex-col gap-2">
              <div className="text-lg font-semibold">{invitation.team.name}</div>
              {invitation.team.description ? (
                <div className="text-sm text-muted-foreground">{invitation.team.description}</div>
              ) : (
                <div className="text-sm text-muted-foreground">No team description provided.</div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Invite for:</span>
                <span className="text-foreground font-medium">{invitation.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Expires:</span>
                <span className="text-foreground font-medium">{expiresText}</span>
              </div>
              <div className="sm:col-span-2 text-muted-foreground">
                Invited by{" "}
                <span className="text-foreground font-medium">
                  {invitation.inviter?.name || "A teammate"}
                </span>
                {invitation.inviter?.email ? (
                  <>
                    {" "}
                    (<span className="font-medium text-foreground">{invitation.inviter.email}</span>)
                  </>
                ) : null}
              </div>
              <div className="sm:col-span-2 text-muted-foreground">
                <span className="text-foreground font-medium">Role permissions:</span>{" "}
                {getRoleDescription(invitation.role)}
              </div>
            </div>
          </div>

          {!user ? (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="text-sm text-muted-foreground">
                You must sign in with <span className="font-medium text-foreground">{invitation.email}</span> to accept.
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button asChild>
                  <SignInButton mode="redirect" forceRedirectUrl={invitePath} fallbackRedirectUrl={invitePath}>
                    <span>Sign in / Create account</span>
                  </SignInButton>
                </Button>
                <Button variant="outline" onClick={() => router.push("/")}>Back to Home</Button>
              </div>
            </div>
          ) : signedInEmail === inviteEmail ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={acceptInvitation} disabled={accepting} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                {accepting ? "Accepting…" : "Accept invitation"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/teams")}>View teams</Button>
            </div>
          ) : (
            <div className="rounded-lg border bg-destructive/5 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium">Wrong account signed in</div>
                  <div className="text-muted-foreground">
                    This invite is for <span className="font-medium text-foreground">{invitation.email}</span>, but you’re signed in as{" "}
                    <span className="font-medium text-foreground">{user.emailAddresses?.[0]?.emailAddress}</span>.
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" asChild>
                  <SignOutButton signOutOptions={{ redirectUrl: `/sign-in?redirect_url=${encodeURIComponent(invitePath)}` }}>
                    <span>Sign out and sign in again</span>
                  </SignOutButton>
                </Button>
                <Button variant="secondary" onClick={handleSwitchAccount}>
                  Switch account
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
