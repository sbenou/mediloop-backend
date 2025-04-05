
import React from "react";
import { Activity, ActivityType } from "@/components/activity/ActivityItem";
import { formatActivityTime } from "@/utils/activityUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ActivitiesTableViewProps {
  activities: Activity[];
  markAsRead: (id: string) => void;
}

// Function to get activity type border color
const getActivityTypeBorderColor = (type: ActivityType) => {
  switch (type) {
    case "prescription_created":
    case "prescription_updated":
      return "border-l-purple-500"; 
    case "order_placed":
      return "border-l-blue-500";
    case "order_shipped":
    case "order_delivered":
    case "delivery_status_updated":
      return "border-l-green-500";
    case "appointment_scheduled":
    case "teleconsultation_scheduled":
    case "new_teleconsultation":
      return "border-l-indigo-500";
    case "doctor_connected":
    case "patient_connected":
      return "border-l-teal-500";
    case "profile_updated":
      return "border-l-gray-500";
    case "payment_processed":
      return "border-l-emerald-500";
    case "payment_failed":
      return "border-l-red-500";
    case "system_alert":
      return "border-l-amber-500";
    default:
      // Check for common patterns in the type string
      if (type.includes('order') || type.includes('purchase')) {
        return "border-l-blue-500";
      } else if (type.includes('prescription') || type.includes('medication')) {
        return "border-l-purple-500";
      } else if (type.includes('appointment') || type.includes('consultation')) {
        return "border-l-indigo-500";
      } else if (type.includes('patient') || type.includes('doctor') || type.includes('connected')) {
        return "border-l-teal-500";
      } else if (type.includes('payment') || type.includes('billing')) {
        return "border-l-emerald-500";
      } else if (type.includes('delivery') || type.includes('shipped')) {
        return "border-l-green-500";
      } else if (type.includes('alert') || type.includes('warning') || type.includes('error')) {
        return "border-l-red-500";
      } else if (type.includes('profile') || type.includes('settings')) {
        return "border-l-gray-500";
      }
      
      // Default fallback
      return "border-l-gray-500";
  }
};

export const ActivitiesTableView: React.FC<ActivitiesTableViewProps> = ({ 
  activities, 
  markAsRead 
}) => {
  return (
    <div className="rounded-md border">
      <ScrollArea className="h-[500px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Type</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="w-[180px]">Time</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[80px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((activity) => {
              const borderColorClass = getActivityTypeBorderColor(activity.type);
              
              return (
                <TableRow 
                  key={activity.id}
                  className={cn(
                    "border-l-2", 
                    borderColorClass,
                    activity.read ? "opacity-70" : ""
                  )}
                >
                  <TableCell className="font-medium">{activity.type.replace(/_/g, ' ')}</TableCell>
                  <TableCell>
                    <div className="font-medium">{activity.title}</div>
                    <div className="text-sm text-muted-foreground">{activity.description}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatActivityTime(activity.timestamp)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {activity.read ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Read
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Unread
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {!activity.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(activity.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span className="sr-only">Mark as read</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};
