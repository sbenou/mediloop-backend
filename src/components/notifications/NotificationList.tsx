
import React from "react";
import { Notification } from "@/types/domain";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check } from "lucide-react";

interface NotificationListProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
}

const NotificationList = ({ notifications, onMarkRead }: NotificationListProps) => {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <Bell className="h-10 w-10 mb-2 opacity-20" />
        <p>No notifications to display</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[300px]">
      <div className="divide-y">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`relative flex items-start p-3 gap-3 ${!notification.read ? "bg-muted/30" : ""}`}
          >
            <div className="flex-1">
              <h4 className="text-sm font-medium">{notification.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
              <span className="text-[10px] text-muted-foreground mt-1 block">
                {new Date(notification.created_at).toLocaleString()}
              </span>
            </div>
            {!notification.read && (
              <button
                onClick={() => onMarkRead(notification.id)}
                className="text-primary hover:text-primary/80 ml-auto"
                aria-label="Mark as read"
              >
                <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default NotificationList;
