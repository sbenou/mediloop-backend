
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
  sortBy: "newest" | "oldest" | "type",
  dateRange?: string,
  selectedTypeFilters?: ActivityType[]
): Activity[] => {
  // Start with type filtering
  let filtered = activities;
  
  // Apply type filters if selected
  if (selectedTypeFilters && selectedTypeFilters.length > 0) {
    filtered = filtered.filter(activity => 
      selectedTypeFilters.includes(activity.type as ActivityType)
    );
  } else if (activeFilter !== "all") {
    // Legacy single type filter if no multi-selection
    filtered = filtered.filter(activity => activity.type === activeFilter);
  }
  
  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      activity => {
        return (
          activity.title.toLowerCase().includes(query) ||
          activity.description.toLowerCase().includes(query) ||
          activity.type.toLowerCase().includes(query)
        );
      }
    );
  }
  
  // Apply date range filter
  if (dateRange && dateRange !== "all") {
    const now = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case "this_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter(
          activity => new Date(activity.timestamp) >= startDate
        );
        break;
      case "last_3_months":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        filtered = filtered.filter(
          activity => new Date(activity.timestamp) >= startDate
        );
        break;
      case "last_6_months":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 6);
        filtered = filtered.filter(
          activity => new Date(activity.timestamp) >= startDate
        );
        break;
      case "this_year":
        startDate = new Date(now.getFullYear(), 0, 1);
        filtered = filtered.filter(
          activity => new Date(activity.timestamp) >= startDate
        );
        break;
      default:
        // Check if it's a specific year filter
        if (/^\d{4}$/.test(dateRange)) {
          const year = parseInt(dateRange, 10);
          const startOfYear = new Date(year, 0, 1);
          const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
          
          filtered = filtered.filter(activity => {
            const activityDate = new Date(activity.timestamp);
            return activityDate >= startOfYear && activityDate <= endOfYear;
          });
        }
    }
  }
  
  // Apply sorting
  return [...filtered].sort((a, b) => {
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

// Filter activities by date range
export const filterByDateRange = (
  activities: Activity[],
  dateRange: string
): Activity[] => {
  if (!dateRange || dateRange === "all") return activities;
  
  const now = new Date();
  let startDate: Date;
  
  switch (dateRange) {
    case "this_month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "last_3_months":
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "last_6_months":
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 6);
      break;
    case "this_year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      // Check if it's a specific year filter
      if (/^\d{4}$/.test(dateRange)) {
        const year = parseInt(dateRange, 10);
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
        
        return activities.filter(activity => {
          const activityDate = new Date(activity.timestamp);
          return activityDate >= startOfYear && activityDate <= endOfYear;
        });
      }
      return activities;
  }
  
  return activities.filter(activity => {
    const activityDate = new Date(activity.timestamp);
    return activityDate >= startDate;
  });
};
