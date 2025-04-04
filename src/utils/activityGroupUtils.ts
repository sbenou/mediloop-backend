
import { Activity } from "@/components/activity/ActivityItem";

// Group activities by date (today, yesterday, earlier this week, earlier)
export const groupActivitiesByDate = (activities: Activity[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  return {
    today: activities.filter(a => new Date(a.timestamp) >= today),
    yesterday: activities.filter(a => new Date(a.timestamp) >= yesterday && new Date(a.timestamp) < today),
    thisWeek: activities.filter(a => new Date(a.timestamp) >= lastWeek && new Date(a.timestamp) < yesterday),
    earlier: activities.filter(a => new Date(a.timestamp) < lastWeek)
  };
};
