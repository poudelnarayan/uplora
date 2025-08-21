"use client";

import { useState } from "react";
import { TextField, SelectField } from "@/components/ui/TextField";
import { Mail, User, MessageSquare, Send, Lightbulb } from "lucide-react";
import styles from "./ContactForm.module.css";

interface ContactFormProps {
  onSubmit: (formData: {
    name: string;
    email: string;
    subject: string;
    category: string;
    message: string;
  }) => Promise<void>;
  isSubmitted: boolean;
  onReset: () => void;
}

export default function ContactForm({ onSubmit, isSubmitted, onReset }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "General",
    message: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) return;
    
    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({ name: "", email: "", subject: "", category: "General", message: "" });
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={styles.successContainer}>
        <div className={styles.successContent}>
          <div className={styles.successIcon}>
            <Send className={styles.successIconSvg} />
          </div>
          <h3 className={styles.successTitle}>Message Sent!</h3>
          <p className={styles.successMessage}>
            Thanks for reaching out! We've received your message and will get back to you soon.
          </p>
          <button 
            onClick={onReset}
            className={styles.resetButton}
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <TextField
            label="Your Name"
            icon={<User className="w-4 h-4" />}
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: (e.target as HTMLInputElement).value })}
          />
          <TextField
            label="Email Address"
            icon={<Mail className="w-4 h-4" />}
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: (e.target as HTMLInputElement).value })}
            required
          />
        </div>

        <div className={styles.formGrid}>
          <TextField
            label="Subject"
            icon={<MessageSquare className="w-4 h-4" />}
            placeholder="How can we help?"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: (e.target as HTMLInputElement).value })}
          />
          <SelectField
            label="Category"
            icon={<Lightbulb className="w-4 h-4" />}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: (e.target as HTMLSelectElement).value })}
          >
            <option value="General">General Inquiry</option>
            <option value="Support">Technical Support</option>
            <option value="Billing">Billing & Subscriptions</option>
            <option value="Feature">Feature Request</option>
            <option value="Bug">Bug Report</option>
            <option value="Partnership">Partnership</option>
          </SelectField>
        </div>

        <TextField
          label="Message"
          icon={<MessageSquare className="w-4 h-4" />}
          placeholder="Tell us about your question or how we can help..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: (e.target as HTMLTextAreaElement).value })}
          multiline
          required
        />

        <div className={styles.submitSection}>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading || !formData.message.trim()}
          >
            {loading ? (
              <>
                <div className={styles.spinner} />
                Sending Message...
              </>
            ) : (
              <>
                <Send className={styles.submitIcon} />
                Send Message
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}