
import React from "react";
import { Activity } from "@/components/activity/ActivityItem";
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

interface ActivitiesTableViewProps {
  activities: Activity[];
  markAsRead: (id: string) => void;
}

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
            {activities.map((activity) => (
              <TableRow key={activity.id}>
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
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};
