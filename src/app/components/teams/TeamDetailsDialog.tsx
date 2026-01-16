 "use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserX,
  Settings,
  Edit,
  UserPlus,
  X,
  Shield,
  Clock,
  Loader2,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Plus,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Separator } from "@/app/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { PlatformIcon, platformIcons } from "./PlatformIcon";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string; // userId
  name: string;
  email: string;
  role: string;
  avatar: string;
  platforms: string[];
}

interface Team {
  id: number;
  backendId?: string;
  name: string;
  description: string;
  platforms: string[];
  members_data: TeamMember[];
  color: string;
  role?: string;
  isOwner?: boolean;
}

interface TeamDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  onRemoveMember: (teamId: number, memberUserId: string) => Promise<void> | void;
  onEditTeam: (team: Team) => void;
  onInviteMember: (teamId: number) => void;
  onUpdateTeam: (teamId: number, updates: Partial<Team>) => void;
}

const roleColors = {
  admin: "bg-red-100 text-red-800 border-red-200",
  manager: "bg-blue-100 text-blue-800 border-blue-200", 
  editor: "bg-green-100 text-green-800 border-green-200",
  viewer: "bg-gray-100 text-gray-800 border-gray-200"
};

export const TeamDetailsDialog = ({ 
  isOpen, 
  onClose, 
  team, 
  onRemoveMember,
  onEditTeam,
  onInviteMember,
  onUpdateTeam
}: TeamDetailsDialogProps) => {
  const { toast } = useToast();
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [loadingConnected, setLoadingConnected] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [removingMember, setRemovingMember] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [cancelInviteOpen, setCancelInviteOpen] = useState(false);
  const [cancelInviteTarget, setCancelInviteTarget] = useState<any | null>(null);
  const [cancelingInvite, setCancelingInvite] = useState(false);
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);

  const canManageTeam = Boolean(team?.isOwner) || team?.role === "OWNER";

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      setLoadingConnected(true);
      try {
        const res = await fetch("/api/social-connections/status", { cache: "no-store" });
        const js = await res.json().catch(() => ({}));
        if (!cancelled) setConnectedPlatforms(Array.isArray(js?.connectedPlatforms) ? js.connectedPlatforms : []);
      } catch {
        if (!cancelled) setConnectedPlatforms([]);
      } finally {
        if (!cancelled) setLoadingConnected(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!team?.backendId) return;
    if (!canManageTeam) {
      setInvites([]);
      setLoadingInvites(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingInvites(true);
      try {
        const res = await fetch(`/api/teams/${encodeURIComponent(String(team.backendId))}/details`, { cache: "no-store" });
        const js = await res.json().catch(() => ({}));
        const payload = js?.data ?? js;
        const nextInvites = Array.isArray(payload?.invites)
          ? payload.invites
          : Array.isArray(payload?.data?.invites)
          ? payload.data.invites
          : [];
        if (!cancelled) setInvites(nextInvites);
      } catch {
        if (!cancelled) setInvites([]);
      } finally {
        if (!cancelled) setLoadingInvites(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, team?.backendId, canManageTeam]);

  const addablePlatforms = useMemo(() => {
    const connected = connectedPlatforms.filter((p) => p && Object.prototype.hasOwnProperty.call(platformIcons, p));
    return connected.filter((p) => !team?.platforms?.includes(p));
  }, [connectedPlatforms, team?.platforms]);

  const openRemoveMemberConfirm = (member: TeamMember) => {
    setRemoveTarget(member);
    setRemoveConfirmOpen(true);
  };

  const confirmRemoveMember = async () => {
    if (!team || !removeTarget) return;
    setRemovingMember(true);
    try {
      await onRemoveMember(team.id, removeTarget.id);
      setRemoveConfirmOpen(false);
      setRemoveTarget(null);
    } finally {
      setRemovingMember(false);
    }
  };

  const handleRemovePlatform = (platform: string) => {
    if (team) {
      const updatedPlatforms = team.platforms.filter(p => p !== platform);
      onUpdateTeam(team.id, { platforms: updatedPlatforms });
      toast({
        title: "Platform Removed ✨",
        description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} access removed from ${team.name}`,
        variant: "default"
      });
    }
  };

  const handleAddPlatform = (platform: string) => {
    if (team && !team.platforms.includes(platform)) {
      const updatedPlatforms = [...team.platforms, platform];
      onUpdateTeam(team.id, { platforms: updatedPlatforms });
      toast({
        title: "Platform Added! 🚀",
        description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} access granted to ${team.name}`,
        variant: "default"
      });
    }
  };

  if (!team) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) {
          setRemoveConfirmOpen(false);
          setRemoveTarget(null);
          setRemovingMember(false);
          setCancelInviteOpen(false);
          setCancelInviteTarget(null);
          setCancelingInvite(false);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-xl border border-border/50">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl bg-gradient-to-r ${team.color} text-white shadow-2xl ring-4 ring-white/20`}>
                <Users className="h-7 w-7" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {team.name}
                </DialogTitle>
                <DialogDescription className="text-lg mt-2 text-muted-foreground">
                  {team.description}
                </DialogDescription>
              </div>
            </div>
            <div className="flex gap-3">
              {canManageTeam && (
                <>
                  <Button variant="outline" size="sm" className="gap-2 hover:scale-105 transition-transform" onClick={() => onEditTeam(team)}>
                    <Edit className="h-4 w-4" />
                    Edit Team
                  </Button>
                  <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-transform shadow-lg" onClick={() => onInviteMember(team.id)}>
                    <UserPlus className="h-4 w-4" />
                    Invite Member
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8 py-6">

          {/* Platform Access */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Platform Access</h3>
              <Link href="/social">
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Connect More Platforms
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground">
              Click on your connected platforms to grant team access. Only platforms connected to your account are shown.
            </p>

            {/* Show all user's connected platforms */}
            {loadingConnected ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading platforms...</span>
              </div>
            ) : connectedPlatforms.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {connectedPlatforms.map((platform) => {
                  const isConnectedToTeam = team.platforms.includes(platform);
                  const Icon = platformIcons[platform as keyof typeof platformIcons];
                  
                  return (
                    <div
                      key={platform}
                      onClick={() => {
                        if (!canManageTeam) return;
                        if (isConnectedToTeam) {
                          handleRemovePlatform(platform);
                        } else {
                          handleAddPlatform(platform);
                        }
                      }}
                      className={`
                        relative group flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer
                        ${isConnectedToTeam
                          ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 hover:border-green-400 dark:hover:border-green-600 shadow-sm"
                          : "bg-card border-border hover:border-primary/50 hover:bg-muted/50"
                        }
                        ${!canManageTeam ? "cursor-not-allowed opacity-60" : "hover:scale-105"}
                      `}
                    >
                      {isConnectedToTeam && (
                        <div className="absolute top-2 right-2">
                          <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm"></div>
                        </div>
                      )}
                      <div className={`
                        p-3 rounded-lg transition-colors
                        ${isConnectedToTeam
                          ? "bg-green-100 dark:bg-green-900/40"
                          : "bg-muted"
                        }
                      `}>
                        <Icon className={`h-6 w-6 ${
                          isConnectedToTeam
                            ? "text-green-700 dark:text-green-400"
                            : "text-muted-foreground"
                        }`} />
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-semibold capitalize ${
                          isConnectedToTeam
                            ? "text-green-700 dark:text-green-400"
                            : "text-foreground"
                        }`}>
                          {platform}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isConnectedToTeam ? "Connected" : "Click to connect"}
                        </p>
                      </div>
                      {canManageTeam && isConnectedToTeam && (
                        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePlatform(platform);
                            }}
                          >
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <LinkIcon className="h-10 w-10 text-muted-foreground mb-3" />
                  <h4 className="font-semibold mb-1">No platforms connected</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your social media accounts to enable team publishing
                  </p>
                  <Link href="/social">
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Connect Platforms
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Team Members */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Team Members</h3>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium">
                {team.members_data.length} members
              </Badge>
            </div>

            {team.members_data.length === 0 && invites.filter((i) => String(i?.status || "").toUpperCase() === "PENDING").length === 0 ? (
              <Card className="text-center py-4 border-dashed">
                <CardContent>
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-6 w-6 text-muted-foreground" />
                    <div>
                      <h4 className="text-sm font-medium">No members yet</h4>
                      <p className="text-xs text-muted-foreground">Invite team members to get started</p>
                    </div>
                    {canManageTeam && (
                      <Button onClick={() => onInviteMember(team.id)} size="sm" className="mt-1">
                        <UserPlus className="h-3 w-3 mr-1" />
                        Invite Member
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {/* Pending invites inside members list */}
                {canManageTeam &&
                  invites
                    .filter((i) => String(i?.status || "").toUpperCase() === "PENDING")
                    .map((invite) => (
                      <Card key={`invite-${invite.id}`} className="group hover:shadow-sm transition-shadow border-border/50">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-muted text-xs">
                                  {String(invite?.email || "?").slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm truncate">{invite.email}</span>
                                  {invite.role && (
                                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                                      {String(invite.role)}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                                    Pending
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">Invitation not accepted yet</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                disabled={resendingInviteId === String(invite.id) || !team?.backendId}
                                onClick={async () => {
                                  if (!team?.backendId) return;
                                  const inviteId = String(invite.id);
                                  setResendingInviteId(inviteId);
                                  try {
                                    const res = await fetch(
                                      `/api/teams/${encodeURIComponent(String(team.backendId))}/invite/${encodeURIComponent(inviteId)}`,
                                      { method: "POST" }
                                    );
                                    const js = await res.json().catch(() => ({}));
                                    if (!res.ok) throw new Error(js?.error || js?.message || "Failed to resend invitation");
                                    toast({ title: "Invitation resent", description: `Resent to ${invite.email}` });
                                  } catch (e) {
                                    toast({
                                      title: "Resend failed",
                                      description: e instanceof Error ? e.message : "Please try again",
                                      variant: "destructive",
                                    });
                                  } finally {
                                    setResendingInviteId(null);
                                  }
                                }}
                              >
                                {resendingInviteId === String(invite.id) ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Resending…
                                  </>
                                ) : (
                                  "Resend"
                                )}
                              </Button>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive/20 hover:bg-destructive/10"
                                onClick={() => {
                                  setCancelInviteTarget(invite);
                                  setCancelInviteOpen(true);
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                {team.members_data.map((member) => (
                  <Card key={member.id} className="group hover:shadow-sm transition-shadow border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="bg-muted text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{member.name}</span>
                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                {member.role}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {member.platforms.slice(0, 3).map((platform) => {
                                const Icon = platformIcons[platform as keyof typeof platformIcons] || Users;
                                return (
                                  <div key={platform} className="h-4 w-4 rounded-sm bg-muted flex items-center justify-center">
                                    <Icon className="h-2.5 w-2.5 text-muted-foreground" />
                                  </div>
                                );
                              })}
                              {member.platforms.length > 3 && (
                                <div className="h-4 w-4 rounded-sm bg-muted flex items-center justify-center">
                                  <span className="text-xs">+{member.platforms.length - 3}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {canManageTeam && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => openRemoveMemberConfirm(member)}
                          >
                            <UserX className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Confirm removal */}
        <Dialog
          open={removeConfirmOpen}
          onOpenChange={(next) => {
            if (removingMember) return;
            setRemoveConfirmOpen(next);
            if (!next) setRemoveTarget(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <UserX className="h-4 w-4" />
                </span>
                Remove member?
              </DialogTitle>
              <DialogDescription>
                {removeTarget ? (
                  <>
                    This will remove <span className="font-medium text-foreground">{removeTarget.name}</span> from{" "}
                    <span className="font-medium text-foreground">{team.name}</span>. They will lose access immediately.
                  </>
                ) : (
                  "This will remove this user from the team."
                )}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRemoveConfirmOpen(false)}
                disabled={removingMember}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={confirmRemoveMember}
                disabled={removingMember || !removeTarget}
              >
                {removingMember ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Removing…
                  </span>
                ) : (
                  "Remove"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm cancel invite */}
        <Dialog
          open={cancelInviteOpen}
          onOpenChange={(next) => {
            if (cancelingInvite) return;
            setCancelInviteOpen(next);
            if (!next) setCancelInviteTarget(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cancel invitation?</DialogTitle>
              <DialogDescription>
                {cancelInviteTarget?.email ? (
                  <>
                    This will cancel the pending invitation for{" "}
                    <span className="font-medium text-foreground">{cancelInviteTarget.email}</span>. They will not be able to join using the old invite link.
                  </>
                ) : (
                  "This will cancel the pending invitation."
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" disabled={cancelingInvite} onClick={() => setCancelInviteOpen(false)}>
                Keep
              </Button>
              <Button
                type="button"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={cancelingInvite || !cancelInviteTarget?.id || !team?.backendId}
                onClick={async () => {
                  if (!team?.backendId || !cancelInviteTarget?.id) return;
                  setCancelingInvite(true);
                  try {
                    const res = await fetch(
                      `/api/teams/${encodeURIComponent(String(team.backendId))}/invite/${encodeURIComponent(String(cancelInviteTarget.id))}`,
                      { method: "DELETE" }
                    );
                    const js = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(js?.error || js?.message || "Failed to cancel invite");
                    setInvites((prev) => prev.filter((i) => i?.id !== cancelInviteTarget.id));
                    toast({ title: "Invitation canceled", description: "The pending invite was canceled." });
                    setCancelInviteOpen(false);
                    setCancelInviteTarget(null);
                  } catch (e) {
                    toast({
                      title: "Cancel failed",
                      description: e instanceof Error ? e.message : "Please try again",
                      variant: "destructive",
                    });
                  } finally {
                    setCancelingInvite(false);
                  }
                }}
              >
                {cancelingInvite ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Canceling…
                  </span>
                ) : (
                  "Cancel invite"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};