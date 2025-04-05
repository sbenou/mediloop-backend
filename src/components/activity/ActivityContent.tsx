
import React, { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActivityGroup } from "./ActivityGroup";
import { ActivityEmptyState } from "./ActivityEmptyState";
import { Activity, ActivityType } from "./ActivityItem";
import { groupActivitiesByDate } from "@/utils/activityGroupUtils";

interface ActivityContentProps {
  activities: Activity[];
  onMarkRead: (id: string) => void;
  activeTab: "all" | ActivityType;
}

export const ActivityContent: React.FC<ActivityContentProps> = ({ 
  activities, 
  onMarkRead,
  activeTab
}) => {
  // Memoize filtered activities to avoid unnecessary recalculations
  const filteredActivities = useMemo(() => {
    return activeTab === "all" 
      ? activities 
      : activities.filter(activity => activity.type === activeTab);
  }, [activities, activeTab]);
  
  // Memoize grouped activities to avoid unnecessary recalculations
  const groupedActivities = useMemo(() => {
    return groupActivitiesByDate(filteredActivities);
  }, [filteredActivities]);
  
  const hasActivities = filteredActivities.length > 0;
  
  return (
    <ScrollArea className="h-[calc(100vh-250px)]">
      {!hasActivities ? (
        <ActivityEmptyState />
      ) : (
        <div className="space-y-6">
          <ActivityGroup 
            title="Today" 
            activities={groupedActivities.today} 
            onMarkRead={onMarkRead} 
          />
          
          <ActivityGroup 
            title="Yesterday" 
            activities={groupedActivities.yesterday} 
            onMarkRead={onMarkRead} 
          />
          
          <ActivityGroup 
            title="This Week" 
            activities={groupedActivities.thisWeek} 
            onMarkRead={onMarkRead} 
          />
          
          <ActivityGroup 
            title="Earlier" 
            activities={groupedActivities.earlier} 
            onMarkRead={onMarkRead} 
          />
        </div>
      )}
    </ScrollArea>
  );
};
