"use client";

import { motion } from "framer-motion";

const MotionDiv = motion.div as any;
import { Plus } from "lucide-react";

interface TeamHeaderProps {
  onCreateTeam: () => void;
}

export default function TeamHeader({ onCreateTeam }: TeamHeaderProps) {
  return (
    <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <div className="text-center lg:text-left lg:flex lg:items-center lg:justify-between">
        <div>
          <h1 className="heading-2 mb-2">Team Management</h1>
          <p className="text-muted-foreground">Manage your team members and invitations</p>
        </div>
        <div className="flex items-center justify-center lg:justify-start gap-2 mt-4 lg:mt-0">
          <button
            onClick={onCreateTeam}
            className="btn btn-primary btn-sm"
            aria-label="Create team"
            title="Create team"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </MotionDiv>
  );
}