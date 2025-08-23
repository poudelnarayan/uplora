"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import styles from "./ContactFAQ.module.css";

const MotionDiv = motion.div as any;

const faqs = [
  {
    question: "How do I get started with Uplora?",
    answer: "Simply sign up for a free account, connect your YouTube channel, and start uploading videos. You can create teams and invite collaborators to streamline your content workflow."
  },
  {
    question: "Can I use Uplora with multiple YouTube channels?",
    answer: "Currently, each Uplora account can be connected to one YouTube channel. If you manage multiple channels, you'll need separate accounts for each."
  },
  {
    question: "How does the team approval process work?",
    answer: "Team members can upload videos that go into a pending state. Team owners can then review, approve, and publish these videos directly to YouTube with one click."
  },
  {
    question: "Is my content secure on Uplora?",
    answer: "Yes! We use enterprise-grade security with encrypted storage and secure connections. Your content is only accessible to your team members and is never shared with third parties."
  },
  {
    question: "What video formats are supported?",
    answer: "We support all major video formats including MP4, MOV, AVI, WebM, and MKV. Files are automatically optimized for YouTube upload."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Absolutely! You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your current billing period."
  }
];

export default function ContactFAQ() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.iconContainer}>
          <HelpCircle className={styles.icon} />
        </div>
        <h2 className={styles.title}>Frequently Asked Questions</h2>
        <p className={styles.subtitle}>
          Quick answers to common questions about Uplora
        </p>
      </div>

      <div className={styles.faqList}>
        {faqs.map((faq, index) => {
          const isOpen = openItems.includes(index);
          
          return (
            <MotionDiv
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={styles.faqItem}
            >
              <button
                onClick={() => toggleItem(index)}
                className={styles.questionButton}
              >
                <span className={styles.questionText}>{faq.question}</span>
                <ChevronDown 
                  className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                />
              </button>
              
              <AnimatePresence>
                {isOpen && (
                  <MotionDiv
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={styles.answerContainer}
                  >
                    <div className={styles.answer}>
                      {faq.answer}
                    </div>
                  </MotionDiv>
                )}
              </AnimatePresence>
            </MotionDiv>
          );
        })}
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          Still have questions? <a href="mailto:support@uplora.io" className={styles.footerLink}>Contact our support team</a>
        </p>
      </div>
    </div>
  );
}