"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import PrioritySelector from "./PrioritySelector";
import styles from "./IdeaForm.module.css";

interface IdeaFormProps {
  onSubmit: (title: string, description: string, priority: string) => Promise<void>;
}

export default function IdeaForm({ onSubmit }: IdeaFormProps) {
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDescription, setIdeaDescription] = useState("");
  const [ideaPriority, setIdeaPriority] = useState<"low" | "medium" | "high">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!ideaTitle.trim() || !ideaDescription.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(ideaTitle.trim(), ideaDescription.trim(), ideaPriority);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.titleSection}>
        <label className={styles.label}>Feature Title</label>
        <input
          type="text"
          value={ideaTitle}
          onChange={(e) => setIdeaTitle(e.target.value)}
          placeholder="What would you like to see?"
          className={styles.input}
        />
      </div>

      <PrioritySelector
        selectedPriority={ideaPriority}
        onPriorityChange={setIdeaPriority}
      />

      <div className={styles.descriptionSection}>
        <label className={styles.label}>Tell us more</label>
        <textarea
          value={ideaDescription}
          onChange={(e) => setIdeaDescription(e.target.value)}
          placeholder="How would this feature work? What problem would it solve?"
          className={styles.textarea}
        />
      </div>

      <div className={styles.actions}>
        <button
          onClick={handleSubmit}
          disabled={!ideaTitle.trim() || !ideaDescription.trim() || isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? (
            <div className={styles.submittingContent}>
              <div className={styles.spinner} />
              Submitting...
            </div>
          ) : (
            <div className={styles.submitContent}>
              <Sparkles className="w-4 h-4" />
              Submit Idea
            </div>
          )}
        </button>
      </div>
    </div>
  );
}