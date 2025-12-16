"use client";

import { Bell, Mail, Users, Upload, CheckCircle } from "lucide-react";
import styles from "./NotificationSection.module.css";

export default function NotificationSection() {
  const notifications = [
    {
      icon: Mail,
      title: "Email notifications",
      description: "Receive updates via email",
      defaultChecked: true
    },
    {
      icon: Users,
      title: "Team invitations",
      description: "Get notified of team invites",
      defaultChecked: true
    },
    {
      icon: Upload,
      title: "Upload status updates",
      description: "Track upload progress",
      defaultChecked: true
    },
    {
      icon: CheckCircle,
      title: "Approval notifications",
      description: "Video approval updates",
      defaultChecked: true
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Bell className={styles.icon} />
        <h2 className={styles.title}>Notification Preferences</h2>
      </div>
      
      <div className={styles.content}>
        <div className={styles.notificationList}>
          {notifications.map((notification, index) => {
            const IconComponent = notification.icon;
            return (
              <div key={index} className={styles.notificationItem}>
                <div className={styles.notificationInfo}>
                  <IconComponent className={styles.notificationIcon} />
                  <div className={styles.notificationText}>
                    <span className={styles.notificationTitle}>{notification.title}</span>
                    <p className={styles.notificationDescription}>{notification.description}</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  className={styles.toggle} 
                  defaultChecked={notification.defaultChecked} 
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}