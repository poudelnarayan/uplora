"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import FeedbackTypeSelector from "./FeedbackTypeSelector";
import styles from "./FeedbackForm.module.css";

interface FeedbackFormProps {
  onSubmit: (type: string, message: string) => Promise<void>;
}

export default function FeedbackForm({ onSubmit }: FeedbackFormProps) {
  const [feedbackType, setFeedbackType] = useState<"bug" | "improvement" | "praise">("improvement");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedbackMessage.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(feedbackType, feedbackMessage.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <FeedbackTypeSelector
        selectedType={feedbackType}
        onTypeChange={setFeedbackType}
      />

      <div className={styles.messageSection}>
        <label className={styles.label}>Your message</label>
        <textarea
          value={feedbackMessage}
          onChange={(e) => setFeedbackMessage(e.target.value)}
          placeholder="Tell us what you think..."
          className={styles.textarea}
        />
      </div>

      <div className={styles.actions}>
        <button
          onClick={handleSubmit}
          disabled={!feedbackMessage.trim() || isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? (
            <div className={styles.submittingContent}>
              <div className={styles.spinner} />
              Sending...
            </div>
          ) : (
            <div className={styles.submitContent}>
              <Send className="w-4 h-4" />
              Send Feedback
            </div>
          )}
        </button>
      </div>
    </div>
  );
}