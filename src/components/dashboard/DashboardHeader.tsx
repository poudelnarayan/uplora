"use client";

import { motion } from "framer-motion";

interface DashboardHeaderProps {
  teamName?: string;
}

export default function DashboardHeader({ teamName }: DashboardHeaderProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <div className="text-center lg:text-left">
        <div>
          <h1 className="heading-2 mb-2">
            {teamName ? `${teamName} - Videos` : "Personal Videos"}
          </h1>
          <p className="text-muted-foreground">
            {teamName 
              ? `Manage videos for ${teamName} team` 
              : "Manage your personal YouTube content and track upload status"
            }
          </p>
        </div>
      </div>
    </motion.div>
  );
}