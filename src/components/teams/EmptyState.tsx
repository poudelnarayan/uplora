import { motion } from "framer-motion";
import { Users, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onCreateTeam: () => void;
}

export const EmptyState = ({ onCreateTeam }: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full"
    >
      <Card className="text-center py-16 bg-gradient-to-br from-muted/30 to-muted/10 border-dashed">
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            <div className="p-6 rounded-full bg-primary/10">
              <Users className="h-12 w-12 text-primary" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold">No teams yet</h3>
              <p className="text-muted-foreground max-w-md">
                Create your first team to start managing members and their platform access. 
                Teams help you organize your workflow and control permissions.
              </p>
            </div>
            
            <Button onClick={onCreateTeam} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Create Your First Team
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};