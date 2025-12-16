"use client";

import PublicLayout from "@/app/components/layout/PublicLayout";
import { NextSeoNoSSR } from "@/app/components/seo/NoSSRSeo";
import ContactHeader from "@/app/components/pages/Contact/ContactHeader";
import ContactForm from "@/app/components/pages/Contact/ContactForm";
import ContactInfo from "@/app/components/pages/Contact/ContactInfo";
import ContactFAQ from "@/app/components/pages/Contact/ContactFAQ";
import { useState } from "react";
import styles from "./Contact.module.css";

export default function ContactPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleFormSubmit = async (formData: {
    name: string;
    email: string;
    subject: string;
    category: string;
    message: string;
  }) => {
    try {
      const composed = `${formData.subject ? `Subject: ${formData.subject}\n` : ""}${formData.name ? `From: ${formData.name}${formData.email ? ` <${formData.email}>` : ""}\n` : ""}\n${formData.message}`;
      
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: composed, 
          category: formData.category, 
          includeEmail: true, 
          path: "/contact" 
        })
      });
      
      setFormSubmitted(true);
    } catch (error) {
      console.error("Contact form error:", error);
      throw error;
    }
  };

  return (
    <PublicLayout title="Contact Us">
      <NextSeoNoSSR 
        title="Contact Us" 
        description="Get in touch with the Uplora team for support, questions, or feedback."
        canonical={typeof window !== "undefined" ? window.location.origin + "/contact" : undefined}
      />
      
      <div className={styles.container}>
        <div className={styles.content}>
          <ContactHeader />
          <ContactInfo />
          <ContactForm 
            onSubmit={handleFormSubmit}
            isSubmitted={formSubmitted}
            onReset={() => setFormSubmitted(false)}
          />
          <ContactFAQ />
        </div>
      </div>
    </PublicLayout>
  );
}