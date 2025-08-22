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
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'rgb(34, 40, 49)' }}>Team Management</h1>
          <p style={{ color: 'rgb(57, 62, 70)' }}>Manage your team members and invitations</p>
        </div>
        <div className="flex items-center justify-center lg:justify-start gap-2 mt-4 lg:mt-0">
          <button
            onClick={onCreateTeam}
            className="btn btn-sm px-4 py-2 rounded font-medium transition-colors"
            style={{ 
              backgroundColor: 'rgb(0, 173, 181)', 
              color: 'white',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(57, 62, 70)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgb(0, 173, 181)';
            }}
            aria-label="Create team"
            title="Create team"
          >
            <Plus className="w-4 h-4" style={{ color: 'white' }} />
          </button>
        </div>
      </div>
    </MotionDiv>
  );
}