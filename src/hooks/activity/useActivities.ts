import { useState, useEffect, useCallback } from 'react';
import { toast } from "@/components/ui/use-toast";

export interface Activity {
  id: string;
  timestamp: Date;
  message: string;
  isRead: boolean;
  link?: string;
}

const initialActivities: Activity[] = [
  {
    id: "1",
    timestamp: new Date(),
    message: "Welcome to the platform!",
    isRead: false,
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    message: "Your account has been created.",
    isRead: false,
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    message: "New product added to the catalog.",
    isRead: true,
  },
];

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const count = activities.filter((activity) => !activity.isRead).length;
    setUnreadCount(count);
  }, [activities]);

  const markAsRead = useCallback(
    (activityId: string) => {
      setActivities((prevActivities) =>
        prevActivities.map((activity) =>
          activity.id === activityId ? { ...activity, isRead: true } : activity
        )
      );
      toast({
        title: "Activity marked as read",
        variant: "default", // Changed from "success" to "default" to match allowed types
      });
    },
    [activities]
  );

  const markAllAsRead = useCallback(() => {
    setActivities((prevActivities) =>
      prevActivities.map((activity) => ({ ...activity, isRead: true }))
    );
    toast({
      title: "All activities marked as read",
      variant: "default",
    });
  }, []);

  const addActivity = useCallback((message: string, link?: string) => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      timestamp: new Date(),
      message,
      isRead: false,
      link,
    };
    setActivities((prevActivities) => [newActivity, ...prevActivities]);
  }, []);

  return {
    activities,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addActivity,
  };
}
