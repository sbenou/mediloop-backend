
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Activity, ActivityItem, ActivityType } from "./ActivityItem";

interface ActivityFeedProps {
  activities: Activity[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export const ActivityFeed = ({ activities, onMarkRead, onMarkAllRead }: ActivityFeedProps) => {
  const [activeTab, setActiveTab] = useState<"all" | ActivityType>("all");
  
  const filteredActivities = activeTab === "all" 
    ? activities 
    : activities.filter(activity => activity.type === activeTab);
  
  const unreadCount = activities.filter(a => !a.read).length;
  
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
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Activity Feed</h2>
        {unreadCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onMarkAllRead}
            className="text-xs"
          >
            Mark all read
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setActiveTab(value as "all" | ActivityType)}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="prescription_created">Prescriptions</TabsTrigger>
          <TabsTrigger value="order_placed">Orders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <ScrollArea className="h-[calc(100vh-180px)]">
            {!hasActivities ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No activities to display
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
                          onMarkRead={onMarkRead} 
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
                          onMarkRead={onMarkRead} 
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
                          onMarkRead={onMarkRead} 
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
                          onMarkRead={onMarkRead} 
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="prescription_created" className="mt-0">
          <ScrollArea className="h-[calc(100vh-180px)]">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No prescription activities to display
              </div>
            ) : (
              <div className="space-y-2">
                {filteredActivities.map(activity => (
                  <ActivityItem 
                    key={activity.id} 
                    activity={activity} 
                    onMarkRead={onMarkRead} 
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="order_placed" className="mt-0">
          <ScrollArea className="h-[calc(100vh-180px)]">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No order activities to display
              </div>
            ) : (
              <div className="space-y-2">
                {filteredActivities.map(activity => (
                  <ActivityItem 
                    key={activity.id} 
                    activity={activity} 
                    onMarkRead={onMarkRead} 
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
