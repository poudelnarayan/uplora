"use client";

import styles from "./ContactHeader.module.css";

export default function ContactHeader() {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Get in Touch</h2>
      <p className={styles.subtitle}>
        Have a question, suggestion, or need help? We'd love to hear from you.
      </p>
    </div>
  );
}