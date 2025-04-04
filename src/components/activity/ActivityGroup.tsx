
import React from "react";
import { Activity, ActivityItem } from "./ActivityItem";

interface ActivityGroupProps {
  title: string;
  activities: Activity[];
  onMarkRead: (id: string) => void;
}

export const ActivityGroup: React.FC<ActivityGroupProps> = ({ 
  title, 
  activities,
  onMarkRead 
}) => {
  if (activities.length === 0) return null;
  
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{title}</h3>
      <div className="space-y-2">
        {activities.map(activity => (
          <ActivityItem 
            key={activity.id} 
            activity={activity} 
            onMarkRead={onMarkRead} 
          />
        ))}
      </div>
    </div>
  );
};
