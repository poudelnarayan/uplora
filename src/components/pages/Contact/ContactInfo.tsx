"use client";

import { Mail, Clock, MapPin } from "lucide-react";
import styles from "./ContactInfo.module.css";

export default function ContactInfo() {
  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help with your account",
      value: "support@uplora.io"
    },
    {
      icon: Clock,
      title: "Response Time",
      description: "We typically respond within",
      value: "24 hours"
    },
    {
      icon: MapPin,
      title: "Global Support",
      description: "Available worldwide",
      value: "24/7 Coverage"
    }
  ];

  return (
    <div className={styles.container}>
      {contactMethods.map((method, index) => {
        const IconComponent = method.icon;
        return (
          <div key={index} className={styles.card}>
            <div className={styles.iconContainer}>
              <IconComponent className={styles.icon} />
            </div>
            <h3 className={styles.title}>{method.title}</h3>
            <p className={styles.description}>{method.description}</p>
            <p className={styles.value}>{method.value}</p>
          </div>
        );
      })}
    </div>
  );
}