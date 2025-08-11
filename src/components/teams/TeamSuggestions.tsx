"use client";

import { Lightbulb } from 'lucide-react';

interface TeamTemplate {
  name: string;
  description: string;
}

interface TeamSuggestionsProps {
  onSelectTemplate: (template: TeamTemplate) => void;
}

export default function TeamSuggestions({ onSelectTemplate }: TeamSuggestionsProps) {
  const templates = [
    {
      name: "Content Creation Team",
      description: "Team for video production and content strategy"
    },
    {
      name: "Marketing Team",
      description: "Team for social media and marketing coordination"
    }
  ];

  return (
    <div className="card p-6">
      <h4 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
        <Lightbulb className="w-5 h-5 text-yellow-500" />
        Team Suggestions
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template, index) => (
          <div key={index} className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <h5 className="font-medium text-blue-600 mb-2">{template.name}</h5>
            <p className="text-sm text-muted-foreground mb-3">
              {index === 0 
                ? "Perfect for video editors, script writers, and content strategists"
                : "Ideal for social media managers and marketing specialists"
              }
            </p>
            <button 
              onClick={() => onSelectTemplate(template)}
              className="btn btn-ghost text-sm"
            >
              Use This Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
