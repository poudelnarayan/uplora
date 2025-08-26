"use client";

import { Users, Shield, TrendingUp, Plus } from "lucide-react";
import { motion } from "framer-motion";
const MotionDiv = motion.div as any;

interface EmptyTeamsStateProps {
  onCreateTeam: () => void;
}

export default function EmptyTeamsState({ onCreateTeam }: EmptyTeamsStateProps) {
  return (
    <MotionDiv initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="text-center py-12">
      <MotionDiv initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }} className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center" style={{ backgroundColor: '#EEEEEE', border: '2px solid #00ADB5' }}>
        <Users className="w-12 h-12" style={{ color: '#00ADB5' }} />
      </MotionDiv>
      <MotionDiv initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.08 }}>
        <h3 className="text-2xl font-bold mb-4" style={{ color: '#222831' }}>Create Your First Team</h3>
        <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: '#393E46' }}>
          Start collaborating with your team members by creating a shared workspace for video content management.
        </p>
      </MotionDiv>
      <MotionDiv initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="space-y-4">
        <button
          onClick={onCreateTeam}
          className="px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-105 shadow-lg"
          style={{ 
            backgroundColor: '#00ADB5', 
            color: 'white'
          }}
        >
          <Plus className="w-6 h-6 mr-3 inline" />
          Create Your First Team
        </button>
        
        {/* Team Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-4xl mx-auto">
          {[{ Icon: Users, title: 'Collaborate', desc: 'Work together on video content with role-based permissions' }, { Icon: Shield, title: 'Secure', desc: 'Control who can upload, review, and publish content' }, { Icon: TrendingUp, title: 'Scale', desc: 'Grow your team and manage multiple projects efficiently' }].map((item, idx) => (
            <MotionDiv key={item.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.12 + idx * 0.05 }} className="text-center p-6 rounded-lg" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
              <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
                <item.Icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold mb-2" style={{ color: '#222831' }}>{item.title}</h4>
              <p className="text-sm" style={{ color: '#393E46' }}>{item.desc}</p>
            </MotionDiv>
          ))}
        </div>
      </MotionDiv>
    </MotionDiv>
  );
}
