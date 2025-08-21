"use client";

import { User } from "lucide-react";
import { UserProfile } from "@clerk/nextjs";
import styles from "./ProfileSection.module.css";

export default function ProfileSection() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <User className={styles.icon} />
        <h2 className={styles.title}>Profile</h2>
      </div>
      <div className={styles.content}>
        <UserProfile 
          routing="path" 
          path="/settings" 
          appearance={{
            elements: {
              card: "bg-card border border-border shadow-lg",
            }
          }} 
        />
      </div>
    </div>
  );
}