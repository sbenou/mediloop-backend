
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ActivityType } from "./ActivityItem";
import { useActivities } from "@/hooks/activity";
import { ActivityContent } from "./ActivityContent";
import { ViewAllActivitiesButton } from "./ViewAllActivitiesButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

export const ActivityFeed = () => {
  const { 
    activities, 
    isLoading, 
    unreadCount, 
    markAsRead,
    markAllAsRead
  } = useActivities();
  
  const [activeFilter, setActiveFilter] = useState<"all" | ActivityType>("all");
  
  // Get unique activity types from the loaded activities
  const activityTypes = Array.from(new Set(activities.map(activity => activity.type)));
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Activity Feed</h2>
        {unreadCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={markAllAsRead}
            className="text-xs"
          >
            Mark all read
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select 
          value={activeFilter} 
          onValueChange={(value) => setActiveFilter(value as "all" | ActivityType)}
        >
          <SelectTrigger className="w-full md:w-[220px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            {activityTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <ActivityContent 
        activities={activities}
        onMarkRead={markAsRead}
        activeTab={activeFilter}
        isLoading={isLoading}
      />
      
      {/* Add "View all activities" button at the bottom */}
      <ViewAllActivitiesButton />
    </div>
  );
};
