
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ActivityType } from "./ActivityItem";
import { useActivities } from "@/hooks/activity";
import { ActivityContent } from "./ActivityContent";
import { ViewAllActivitiesButton } from "./ViewAllActivitiesButton";

export const ActivityFeed = () => {
  const { 
    activities, 
    isLoading, 
    unreadCount,
    fetchActivities, 
    markAsRead, 
    markAllAsRead
  } = useActivities();
  
  const [activeTab, setActiveTab] = useState<"all" | ActivityType>("all");
  
  // Set up initial data fetching only
  useEffect(() => {
    console.log("ActivityFeed: Initial data fetch");
    fetchActivities();
  }, [fetchActivities]);
  
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
      
      <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setActiveTab(value as "all" | ActivityType)}>
        <TabsList className="grid grid-cols-2 mb-4 w-full">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          {activityTypes.length > 0 && activityTypes[0] && (
            <TabsTrigger value={activityTypes[0]} className="text-xs whitespace-normal p-1">
              {activityTypes[0].replace(/_/g, ' ')}
            </TabsTrigger>
          )}
        </TabsList>
        
        {/* All activities tab */}
        <TabsContent value="all" className="mt-0">
          <ActivityContent 
            activities={activities}
            onMarkRead={markAsRead}
            activeTab="all"
            isLoading={isLoading}
          />
        </TabsContent>
        
        {/* Dynamically generate tab content for each activity type */}
        {activityTypes.map(type => (
          <TabsContent key={type} value={type} className="mt-0">
            <ActivityContent 
              activities={activities}
              onMarkRead={markAsRead}
              activeTab={type}
              isLoading={isLoading}
            />
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Add "View all activities" button at the bottom */}
      <ViewAllActivitiesButton />
    </div>
  );
};
