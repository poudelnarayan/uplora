"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import FeedbackContent from "./FeedbackContent";
import IdeaLabContent from "./IdeaLabContent";

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
  defaultTab?: "feedback" | "idea";
}) {
  return (
    <div className="space-y-5">
      <Tabs defaultValue={defaultTab}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="idea">Feature request</TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="mt-4">
          <FeedbackContent onSubmit={onSubmitFeedback} onCancel={onCancel} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="idea" className="mt-4">
          <IdeaLabContent onSubmit={onSubmitIdea} onCancel={onCancel} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


