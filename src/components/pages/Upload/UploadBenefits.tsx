"use client";

import { Zap, Shield, Video } from "lucide-react";
import styles from "./UploadBenefits.module.css";

export default function UploadBenefits() {
  const benefits = [
    {
      icon: Zap,
      title: "Fast Upload",
      description: "Quick and reliable"
    },
    {
      icon: Shield,
      title: "Secure",
      description: "Protected storage"
    },
    {
      icon: Video,
      title: "Direct to YouTube",
      description: "Seamless publishing"
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