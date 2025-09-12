import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlatformIcon, platformIcons } from "./PlatformIcon";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { InlineSpinner } from "@/components/ui/loading-spinner";

interface Team {
  id: number;
  name: string;
  platforms: string[];
}

interface InviteMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  selectedTeamId?: number;
  onInviteMember: (memberData: {
    email: string;
    teamId: number;
    role: string;
  }) => Promise<void> | void;
}

export const InviteMemberDialog = ({ 
  isOpen, 
  onClose, 
  teams, 
  selectedTeamId,
  onInviteMember 
}: InviteMemberDialogProps) => {
  const [memberData, setMemberData] = useState({
    email: "",
    teamId: selectedTeamId || "",
    role: "EDITOR"
  });
  const { toast } = useToast();
  const { user } = useUser();
  const [emailError, setEmailError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  };

  const handleSubmit = async () => {
    if (!memberData.email || !memberData.teamId || !memberData.role) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const currentEmail = user?.emailAddresses?.[0]?.emailAddress || "";
    if (currentEmail && memberData.email.trim().toLowerCase() === currentEmail.toLowerCase()) {
      setEmailError("You cannot invite yourself");
      toast({ title: "Cannot invite yourself", description: "Please enter a different email address", variant: "destructive" });
      return;
    }

    if (!validateEmail(memberData.email)) {
      setEmailError("Enter a valid email address");
      toast({ title: "Invalid email", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    try {
      setIsLoading(true);
      await Promise.resolve(onInviteMember({
        email: memberData.email,
        teamId: Number(memberData.teamId),
        role: memberData.role
      }));
      setMemberData({ email: "", teamId: "", role: "" });
      onClose();
      toast({ title: "Invitation Sent", description: `Invitation sent to ${memberData.email}` });
    } catch (e: any) {
      const msg = e?.message || 'Failed to send invitation';
      toast({ title: "Invite failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTeam = teams.find(team => team.id === Number(memberData.teamId));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join a team with specific platform access
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="memberEmail">Email Address *</Label>
            <Input
              id="memberEmail"
              type="email"
              value={memberData.email}
              onChange={(e) => {
                const val = e.target.value;
                setMemberData(prev => ({...prev, email: val}));
                // live validation
                const currentEmail = user?.emailAddresses?.[0]?.emailAddress || "";
                if (currentEmail && val.trim().toLowerCase() === currentEmail.toLowerCase()) {
                  setEmailError("You cannot invite yourself");
                } else if (val && !validateEmail(val)) {
                  setEmailError("Enter a valid email address");
                } else {
                  setEmailError("");
                }
              }}
              placeholder="member@company.com"
            />
            {emailError && (
              <p className="text-xs text-destructive">{emailError}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="selectTeam">Assign to Team *</Label>
            <Select 
              value={memberData.teamId.toString()} 
              onValueChange={(value) => setMemberData(prev => ({...prev, teamId: value}))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="memberRole">Role *</Label>
            <Select 
              value={memberData.role} 
              onValueChange={(value) => setMemberData(prev => ({...prev, role: value}))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EDITOR">Editor - Can create and edit content</SelectItem>
                <SelectItem value="MANAGER">Manager - Can manage team members</SelectItem>
                <SelectItem value="ADMIN">Admin - Full access</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {selectedTeam && (
            <div className="space-y-3">
              <Label>Platform Access (inherited from team)</Label>
              <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg">
                {selectedTeam.platforms.map((platform) => (
                  <div key={platform} className="flex items-center gap-2">
                    <PlatformIcon platform={platform} />
                    <span className="capitalize text-sm">{platform}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                This member will have access to the platforms selected for {selectedTeam.name}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !!emailError || !memberData.email || !memberData.teamId || !memberData.role} className="gap-2">
            {isLoading ? (
              <InlineSpinner size="sm" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {isLoading ? 'Sending…' : 'Send Invitation'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};