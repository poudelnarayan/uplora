import { useState, useEffect } from "react";
import { Plus, Loader2, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Switch } from "@/app/components/ui/switch";
import { PlatformIcon, platformIcons } from "./PlatformIcon";
import { Card, CardContent } from "@/app/components/ui/card";

interface CreateTeamDialogProps {
  onCreateTeam: (team: { name: string; description: string; platforms: string[] }) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isLoading?: boolean;
}

export const CreateTeamDialog = ({ onCreateTeam, isOpen: externalIsOpen, onOpenChange, isLoading = false }: CreateTeamDialogProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    platforms: [] as string[]
  });
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);

  // Fetch connected platforms
  useEffect(() => {
    const fetchConnectedPlatforms = async () => {
      setLoadingPlatforms(true);
      try {
        const connected: string[] = [];

        // Check YouTube
        const ytRes = await fetch('/api/youtube/status', { cache: 'no-store' });
        const ytData = await ytRes.json();
        if (ytData?.isConnected) connected.push('youtube');

        // Check Facebook/Instagram
        const fbRes = await fetch('/api/facebook/status', { cache: 'no-store' });
        const fbData = await fbRes.json();
        if (fbData?.connected) connected.push('facebook');
        if (fbData?.instagramConnected) connected.push('instagram');

        // Check TikTok
        const ttRes = await fetch('/api/tiktok/status', { cache: 'no-store' });
        const ttData = await ttRes.json();
        if (ttData?.isConnected) connected.push('tiktok');

        // Check Threads
        const thRes = await fetch('/api/threads/status', { cache: 'no-store' });
        const thData = await thRes.json();
        if (thData?.isConnected) connected.push('threads');

        // Check Pinterest
        const pinRes = await fetch('/api/pinterest/status', { cache: 'no-store' });
        const pinData = await pinRes.json();
        if (pinData?.isConnected) connected.push('pinterest');

        // Check LinkedIn
        const liRes = await fetch('/api/linkedin/status', { cache: 'no-store' });
        const liData = await liRes.json();
        if (liData?.isConnected) connected.push('linkedin');

        // Check X/Twitter
        const xRes = await fetch('/api/twitter/status', { cache: 'no-store' });
        const xData = await xRes.json();
        if (xData?.isConnected) connected.push('twitter');

        setConnectedPlatforms(connected);
      } catch (error) {
        console.error('Failed to fetch connected platforms:', error);
      } finally {
        setLoadingPlatforms(false);
      }
    };

    if (isOpen) {
      fetchConnectedPlatforms();
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (newTeam.name.trim()) {
      onCreateTeam(newTeam);
      setNewTeam({ name: "", description: "", platforms: [] });
      setIsOpen(false);
    }
  };

  const togglePlatform = (platform: string) => {
    setNewTeam(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Set up a new team and configure platform access
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              value={newTeam.name}
              onChange={(e) => setNewTeam(prev => ({...prev, name: e.target.value}))}
              placeholder="Enter team name"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamDescription">Description</Label>
            <Textarea
              id="teamDescription"
              value={newTeam.description}
              onChange={(e) => setNewTeam(prev => ({...prev, description: e.target.value}))}
              placeholder="Describe the team's purpose"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Platform Access</Label>
              <Link href="/social">
                <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs gap-1">
                  <LinkIcon className="h-3 w-3" />
                  Connect More
                </Button>
              </Link>
            </div>

            {loadingPlatforms ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : connectedPlatforms.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {connectedPlatforms.map((platform) => {
                    const Icon = platformIcons[platform as keyof typeof platformIcons];
                    const isSelected = newTeam.platforms.includes(platform);
                    return (
                      <div
                        key={platform}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-200 ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-border hover:border-primary/50"
                        } ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                        onClick={() => !isLoading && togglePlatform(platform)}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span className="text-sm font-medium capitalize">{platform}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select which platforms this team will have access to
                </p>
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-6 text-center">
                  <LinkIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium mb-1">No platforms connected</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Connect social media accounts to give this team access
                  </p>
                  <Link href="/social">
                    <Button size="sm" variant="outline" className="gap-2">
                      <LinkIcon className="h-3 w-3" />
                      Connect Platforms
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!newTeam.name.trim() || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Team...
              </>
            ) : (
              "Create Team"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
