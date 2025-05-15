
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ActivityType } from "./ActivityItem";
import { useActivities } from "@/hooks/activity";
import { ActivityContent } from "./ActivityContent";
import { ViewAllActivitiesButton } from "./ViewAllActivitiesButton";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";

export const ActivityFeed = () => {
  // Get the current user ID - assuming we have user data
  const userId = "current-user-id"; // This should be replaced with actual user ID
  
  const { 
    activities, 
    isLoading, 
    unreadCount, 
    markAsRead,
    markAllAsRead
  } = useActivities(userId);
  
  const [selectedTypes, setSelectedTypes] = useState<ActivityType[]>([]);
  
  // Get unique activity types from the loaded activities
  const activityTypes = Array.from(new Set(activities.map(activity => activity.type as ActivityType)));
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Activity Feed</h2>
        {unreadCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => markAllAsRead()}
            className="text-xs"
          >
            Mark all read
          </Button>
        )}
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span>
                {selectedTypes.length === 0 
                  ? "All Activities" 
                  : `${selectedTypes.length} type${selectedTypes.length > 1 ? 's' : ''} selected`}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {activityTypes.map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={selectedTypes.includes(type)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedTypes((prev) => [...prev, type]);
                  } else {
                    setSelectedTypes((prev) => prev.filter((item) => item !== type));
                  }
                }}
              >
                {type.replace(/_/g, ' ')}
              </DropdownMenuCheckboxItem>
            ))}
            {selectedTypes.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs justify-center mt-2"
                  onClick={() => setSelectedTypes([])}
                >
                  Clear filters
                </Button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <ActivityContent 
        activities={activities.map(activity => ({
          ...activity,
          read: activity.read || activity.status === 'read',
          timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date()
        }))}
        onMarkRead={markAsRead}
        activeTab="all"
        selectedTypes={selectedTypes}
        isLoading={isLoading}
      />
      
      {/* Add "View all activities" button at the bottom */}
      <ViewAllActivitiesButton />
    </div>
  );
};
