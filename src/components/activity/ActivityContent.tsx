import React, { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActivityGroup } from "./ActivityGroup";
import { ActivityEmptyState } from "./ActivityEmptyState";
import { Activity, ActivityType } from "./ActivityItem";
import { groupActivitiesByDate } from "@/utils/activityGroupUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity as ActivityIcon } from "lucide-react"; // Import Activity icon

interface ActivityContentProps {
  activities: Activity[];
  onMarkRead: (id: string) => void;
  activeTab: "all" | ActivityType;
  selectedTypes?: ActivityType[];
  isLoading: boolean;
}

export const ActivityContent: React.FC<ActivityContentProps> = ({ 
  activities, 
  onMarkRead,
  activeTab,
  selectedTypes = [],
  isLoading
}) => {
  // Memoize filtered activities to avoid unnecessary recalculations
  const filteredActivities = useMemo(() => {
    // If selectedTypes has items, filter by those types
    if (selectedTypes.length > 0) {
      return activities.filter(activity => selectedTypes.includes(activity.type as ActivityType));
    }
    
    // Otherwise use the activeTab filter (for backwards compatibility)
    return activeTab === "all" 
      ? activities 
      : activities.filter(activity => activity.type === activeTab);
  }, [activities, activeTab, selectedTypes]);
  
  // Memoize grouped activities to avoid unnecessary recalculations
  const groupedActivities = useMemo(() => {
    return groupActivitiesByDate(filteredActivities);
  }, [filteredActivities]);
  
  const hasActivities = filteredActivities.length > 0;

  // If loading and no existing activities, show loading skeletons
  if (isLoading && !hasActivities) {
    return (
      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24 mb-4" />
              {[1, 2].map((j) => (
                <Skeleton key={j} className="h-24 w-full rounded-md" />
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  }
  
  // Updated EmptyState component with Activity icon and tighter positioning
  const EmptyState = ({ icon: Icon, message }: { icon: any, message: string }) => (
    <div className="flex flex-col items-center justify-center pt-16 pb-8">
      <Icon className="h-12 w-12 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground text-center">{message}</p>
    </div>
  );

  return (
    <ScrollArea className="h-[calc(100vh-250px)]">
      {!hasActivities ? (
        <EmptyState 
          icon={ActivityIcon} 
          message="No activities to display" 
        />
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
