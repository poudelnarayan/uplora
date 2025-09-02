import { useState } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { PlatformIcon, platformIcons } from "./PlatformIcon";

interface CreateTeamDialogProps {
  onCreateTeam: (team: { name: string; description: string; platforms: string[] }) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CreateTeamDialog = ({ onCreateTeam, isOpen: externalIsOpen, onOpenChange }: CreateTeamDialogProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    platforms: [] as string[]
  });

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
            />
          </div>
          
          <div className="space-y-3">
            <Label>Platform Access</Label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(platformIcons).map((platform) => {
                const Icon = platformIcons[platform as keyof typeof platformIcons];
                const isSelected = newTeam.platforms.includes(platform);
                return (
                  <div
                    key={platform}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted border-border hover:border-primary/50"
                    }`}
                    onClick={() => togglePlatform(platform)}
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
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!newTeam.name.trim()}>
            Create Team
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};