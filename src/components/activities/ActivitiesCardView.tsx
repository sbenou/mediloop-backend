
import React from "react";
import { Activity } from "@/components/activity/ActivityItem";
import { formatActivityTime } from "@/utils/activityUtils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Calendar } from "lucide-react";

interface ActivitiesCardViewProps {
  activities: Activity[];
  markAsRead: (id: string) => void;
}

export const ActivitiesCardView: React.FC<ActivitiesCardViewProps> = ({
  activities,
  markAsRead,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activities.map((activity) => (
        <Card 
          key={activity.id} 
          className={`p-4 ${!activity.read ? 'border-l-4 border-l-blue-500' : ''}`}
        >
          <div className="flex justify-between items-start">
            <div className="text-sm font-medium text-muted-foreground">
              {activity.type.replace(/_/g, ' ')}
            </div>
            {!activity.read && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => markAsRead(activity.id)}
              >
                <CheckCircle className="h-4 w-4" />
                <span className="sr-only">Mark as read</span>
              </Button>
            )}
          </div>
          <div className="mt-2">
            <h3 className="font-medium">{activity.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
          </div>
          <div className="flex items-center mt-4 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            {formatActivityTime(activity.timestamp)}
          </div>
        </Card>
      ))}
    </div>
  );
};
