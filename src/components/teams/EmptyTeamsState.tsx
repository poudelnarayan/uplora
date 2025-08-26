"use client";

import { Users, Shield, TrendingUp, Plus } from "lucide-react";

interface EmptyTeamsStateProps {
  onCreateTeam: () => void;
}

export default function EmptyTeamsState({ onCreateTeam }: EmptyTeamsStateProps) {
  return (
    <div className="text-center py-12">
      <div className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center" style={{ backgroundColor: '#EEEEEE', border: '2px solid #00ADB5' }}>
        <Users className="w-12 h-12" style={{ color: '#00ADB5' }} />
      </div>
      <h3 className="text-2xl font-bold mb-4" style={{ color: '#222831' }}>Create Your First Team</h3>
      <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: '#393E46' }}>
        Start collaborating with your team members by creating a shared workspace for video content management.
      </p>
      <div className="space-y-4">
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
          <div className="text-center p-6 rounded-lg" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
              <Users className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold mb-2" style={{ color: '#222831' }}>Collaborate</h4>
            <p className="text-sm" style={{ color: '#393E46' }}>Work together on video content with role-based permissions</p>
          </div>
          <div className="text-center p-6 rounded-lg" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold mb-2" style={{ color: '#222831' }}>Secure</h4>
            <p className="text-sm" style={{ color: '#393E46' }}>Control who can upload, review, and publish content</p>
          </div>
          <div className="text-center p-6 rounded-lg" style={{ backgroundColor: '#EEEEEE', border: '1px solid #393E46' }}>
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#00ADB5' }}>
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-semibold mb-2" style={{ color: '#222831' }}>Scale</h4>
            <p className="text-sm" style={{ color: '#393E46' }}>Grow your team and manage multiple projects efficiently</p>
          </div>
        </div>
      </div>
    </div>
  );
}
