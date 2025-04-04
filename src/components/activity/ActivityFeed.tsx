
import { useState, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Activity, ActivityItem, ActivityType } from "./ActivityItem";
import { useActivities } from "@/hooks/useActivities";

export const ActivityFeed = () => {
  const { 
    activities, 
    isLoading, 
    fetchActivities, 
    markAsRead, 
    markAllAsRead,
    setupRealtimeSubscription 
  } = useActivities();
  
  const [activeTab, setActiveTab] = useState<"all" | ActivityType>("all");
  
  // Use a stable function for fetching activities
  const fetchActivitiesOnce = useCallback(() => {
    console.log("ActivityFeed: Fetching activities");
    fetchActivities();
  }, [fetchActivities]);
  
  // Initial fetch and subscription setup
  useEffect(() => {
    fetchActivitiesOnce();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [fetchActivitiesOnce, setupRealtimeSubscription]);
  
  useEffect(() => {
    console.log("Loaded activities:", activities.length, activities);
  }, [activities]);
  
  const filteredActivities = activeTab === "all" 
    ? activities 
    : activities.filter(activity => activity.type === activeTab);
  
  const unreadCount = activities.filter(a => !a.read).length;
  
  // Get unique activity types from the loaded activities
  const activityTypes = Array.from(new Set(activities.map(activity => activity.type)));
  
  // Group activities by date (today, yesterday, earlier this week, earlier)
  const groupActivitiesByDate = (activities: Activity[]) => {
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
  
  const groupedActivities = groupActivitiesByDate(filteredActivities);
  
  const hasActivities = filteredActivities.length > 0;
  
  if (isLoading && activities.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <h2 className="text-xl font-semibold mb-4">Activity Feed</h2>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading activities...</div>
        </div>
      </div>
    );
  }
  
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
          <ScrollArea className="h-[calc(100vh-180px)]">
            {!hasActivities ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No activities to display. Try clicking the "Load Activities Data" button at the bottom right.
              </div>
            ) : (
              <div className="space-y-6">
                {groupedActivities.today.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Today</h3>
                    <div className="space-y-2">
                      {groupedActivities.today.map(activity => (
                        <ActivityItem 
                          key={activity.id} 
                          activity={activity} 
                          onMarkRead={markAsRead} 
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {groupedActivities.yesterday.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Yesterday</h3>
                    <div className="space-y-2">
                      {groupedActivities.yesterday.map(activity => (
                        <ActivityItem 
                          key={activity.id} 
                          activity={activity} 
                          onMarkRead={markAsRead} 
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {groupedActivities.thisWeek.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">This Week</h3>
                    <div className="space-y-2">
                      {groupedActivities.thisWeek.map(activity => (
                        <ActivityItem 
                          key={activity.id} 
                          activity={activity} 
                          onMarkRead={markAsRead} 
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {groupedActivities.earlier.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Earlier</h3>
                    <div className="space-y-2">
                      {groupedActivities.earlier.map(activity => (
                        <ActivityItem 
                          key={activity.id} 
                          activity={activity} 
                          onMarkRead={markAsRead} 
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        
        {/* Dynamically generate tab content for each activity type */}
        {activityTypes.map(type => (
          <TabsContent key={type} value={type} className="mt-0">
            <ScrollArea className="h-[calc(100vh-180px)]">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No {type.replace('_', ' ')} activities to display
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredActivities.map(activity => (
                    <ActivityItem 
                      key={activity.id} 
                      activity={activity} 
                      onMarkRead={markAsRead} 
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
