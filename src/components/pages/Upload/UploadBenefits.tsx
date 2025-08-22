"use client";

import { Zap, Shield, Video } from "lucide-react";
import styles from "./UploadBenefits.module.css";

export default function UploadBenefits() {
  const benefits = [
    {
      icon: Zap,
      title: "Fast Creation",
      description: "Quick and reliable posting"
    },
    {
      icon: Shield,
      title: "Secure",
      description: "Protected content"
    },
    {
      icon: Video,
      title: "Multi-Platform",
      description: "YouTube, TikTok & more"
    }
  ];

  return (
    <div className={styles.container}>
      {benefits.map((benefit, index) => {
        const IconComponent = benefit.icon;
        return (
          <div key={index} className={styles.benefit}>
            <div className={styles.iconContainer}>
              <IconComponent className={styles.icon} />
            </div>
            <p className={styles.title}>{benefit.title}</p>
            <p className={styles.description}>{benefit.description}</p>
          </div>
        );
      })}
    </div>
  );
}