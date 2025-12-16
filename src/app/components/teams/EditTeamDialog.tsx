import { useState, useEffect } from "react";
import { Edit, Sparkles, Zap, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Team {
  id: number;
  name: string;
  description: string;
  platforms: string[];
}

interface EditTeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  onUpdateTeam: (teamId: number, updates: Partial<Team>) => void;
}

export const EditTeamDialog = ({ isOpen, onClose, team, onUpdateTeam }: EditTeamDialogProps) => {
  const { toast } = useToast();
  const [editData, setEditData] = useState({
    name: "",
    description: ""
  });

  useEffect(() => {
    if (team) {
      setEditData({
        name: team.name,
        description: team.description
      });
    }
  }, [team]);

  const handleSubmit = () => {
    if (editData.name.trim() && team) {
      onUpdateTeam(team.id, editData);
      toast({
        title: "Team Updated! ✨",
        description: `${editData.name} has been updated successfully`,
        variant: "default"
      });
      onClose();
    }
  };


  if (!team) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background border border-border/50">
        <DialogHeader className="space-y-2 pb-4">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Edit className="h-4 w-4 text-primary" />
            Edit Team
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Update team name and description
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="editTeamName" className="text-sm font-medium">
              Team Name
            </Label>
            <Input
              id="editTeamName"
              value={editData.name}
              onChange={(e) => setEditData(prev => ({...prev, name: e.target.value}))}
              placeholder="Enter team name"
              className="h-9"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="editTeamDescription" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="editTeamDescription"
              value={editData.description}
              onChange={(e) => setEditData(prev => ({...prev, description: e.target.value}))}
              placeholder="Describe the team's purpose"
              rows={3}
              className="resize-none"
            />
          </div>
          
          <div className="p-3 bg-muted/30 border border-border/50 rounded-md">
            <div className="flex items-center gap-2">
              <Settings className="h-3 w-3 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium">Platform access and members</p>
                <p className="text-xs text-muted-foreground">Manage from team view</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
          <Button 
            variant="outline" 
            onClick={onClose}
            size="sm"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!editData.name.trim()}
            size="sm"
          >
            Update
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};