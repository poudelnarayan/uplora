"use client";

import { useState } from "react";
import FeedbackContent from "./FeedbackContent";
import IdeaLabContent from "./IdeaLabContent";
import { MessageCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "feedback" | "idea";

export default function FeedbackHubContent({
  onSubmitFeedback,
  onSubmitIdea,
  onCancel,
  isLoading = false,
  defaultTab = "feedback",
}: {
  onSubmitFeedback: (type: string, message: string) => Promise<void>;
  onSubmitIdea: (title: string, description: string, priority: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  defaultTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  return (
    <div className="space-y-4">
      {/* Slim segmented control — feels lighter than full Tabs */}
      <div className="inline-flex w-full p-0.5 rounded-lg bg-muted/40 border border-border/60">
        <SegmentBtn active={tab === "feedback"} onClick={() => setTab("feedback")} icon={<MessageCircle className="h-3.5 w-3.5" />}>
          Feedback
        </SegmentBtn>
        <SegmentBtn active={tab === "idea"} onClick={() => setTab("idea")} icon={<Lightbulb className="h-3.5 w-3.5" />}>
          Feature request
        </SegmentBtn>
      </div>

      {tab === "feedback" ? (
        <FeedbackContent onSubmit={onSubmitFeedback} onCancel={onCancel} isLoading={isLoading} />
      ) : (
        <IdeaLabContent onSubmit={onSubmitIdea} onCancel={onCancel} isLoading={isLoading} />
      )}
    </div>
  );
}

function SegmentBtn({
  active, onClick, children, icon,
}: { active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}
