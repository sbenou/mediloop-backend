
import { Activity, ActivityType } from "@/components/activity/ActivityItem";
import { format } from "date-fns";

// Format activity timestamp
export const formatActivityTime = (timestamp: string | Date) => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date >= today) {
    return `Today at ${format(date, 'h:mm a')}`;
  } else if (date >= yesterday) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  } else {
    return format(date, 'MMM d, yyyy h:mm a');
  }
};

// Filter and sort activities
export const filterAndSortActivities = (
  activities: Activity[],
  activeFilter: "all" | ActivityType,
  searchQuery: string,
  sortBy: "newest" | "oldest" | "type"
): Activity[] => {
  return activities
    .filter(activity => {
      // Apply type filter
      if (activeFilter !== "all" && activity.type !== activeFilter) return false;
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          activity.title.toLowerCase().includes(query) ||
          activity.description.toLowerCase().includes(query) ||
          activity.type.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      switch (sortBy) {
        case "newest":
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case "oldest":
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case "type":
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });
};

// Get unique activity types from activities
export const getActivityTypes = (activities: Activity[]): ActivityType[] => {
  return Array.from(new Set(activities.map(activity => activity.type))) as ActivityType[];
};

// Calculate pagination
export const paginateActivities = (
  activities: Activity[],
  currentPage: number, 
  itemsPerPage: number
): Activity[] => {
  return activities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
};
