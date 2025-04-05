
import React from "react";
import { Activity, ActivityType } from "@/components/activity/ActivityItem";
import { formatActivityTime } from "@/utils/activityUtils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActivitiesCardViewProps {
  activities: Activity[];
  markAsRead: (id: string) => void;
}

// Function to get activity type styles (copied from ActivityItem)
const getActivityTypeStyles = (type: ActivityType) => {
  switch (type) {
    case "prescription_created":
    case "prescription_updated":
      return { 
        color: "border-purple-500 bg-purple-50" 
      };
    case "order_placed":
      return { 
        color: "border-blue-500 bg-blue-50" 
      };
    case "order_shipped":
    case "order_delivered":
    case "delivery_status_updated":
      return { 
        color: "border-green-500 bg-green-50" 
      };
    case "appointment_scheduled":
    case "teleconsultation_scheduled":
    case "new_teleconsultation":
      return { 
        color: "border-indigo-500 bg-indigo-50" 
      };
    case "doctor_connected":
    case "patient_connected":
      return { 
        color: "border-teal-500 bg-teal-50" 
      };
    case "profile_updated":
      return { 
        color: "border-gray-500 bg-gray-50" 
      };
    case "payment_processed":
      return { 
        color: "border-emerald-500 bg-emerald-50" 
      };
    case "payment_failed":
      return { 
        color: "border-red-500 bg-red-50" 
      };
    case "system_alert":
      return { 
        color: "border-amber-500 bg-amber-50" 
      };
    default:
      // Check for common patterns in the type string
      if (type.includes('order') || type.includes('purchase')) {
        return { color: "border-blue-500 bg-blue-50" };
      } else if (type.includes('prescription') || type.includes('medication')) {
        return { color: "border-purple-500 bg-purple-50" };
      } else if (type.includes('appointment') || type.includes('consultation')) {
        return { color: "border-indigo-500 bg-indigo-50" };
      } else if (type.includes('patient') || type.includes('doctor') || type.includes('connected')) {
        return { color: "border-teal-500 bg-teal-50" };
      } else if (type.includes('payment') || type.includes('billing')) {
        return { color: "border-emerald-500 bg-emerald-50" };
      } else if (type.includes('delivery') || type.includes('shipped')) {
        return { color: "border-green-500 bg-green-50" };
      } else if (type.includes('alert') || type.includes('warning') || type.includes('error')) {
        return { color: "border-red-500 bg-red-50" };
      } else if (type.includes('profile') || type.includes('settings')) {
        return { color: "border-gray-500 bg-gray-50" };
      }
      
      // Default fallback
      return { color: "border-gray-500 bg-gray-50" };
  }
};

export const ActivitiesCardView: React.FC<ActivitiesCardViewProps> = ({
  activities,
  markAsRead,
}) => {
  return (
    <ScrollArea className="h-[calc(100vh-350px)]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
        {activities.map((activity) => {
          const { color } = getActivityTypeStyles(activity.type);
          
          return (
            <Card 
              key={activity.id} 
              className={cn(
                "p-4 border-l-4", 
                color,
                !activity.read ? '' : 'opacity-70'
              )}
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
          );
        })}
      </div>
    </ScrollArea>
  );
};
