
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Notification } from "@/types/supabase"; // Adjust the import path as needed
import NotificationList from "./NotificationList";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface NotificationTabsProps {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onViewAll?: () => void;
}

const NotificationTabs = ({
  notifications,
  unreadCount,
  isLoading,
  onMarkRead,
  onMarkAllRead,
  onViewAll
}: NotificationTabsProps) => {
  const unreadNotifications = notifications.filter(notification => !notification.read);
  const alertNotifications = notifications.filter(notification => 
    ['payment_failed', 'delivery_failed', 'delivery_late'].includes(notification.type)
  );

  return (
    <Tabs defaultValue="all" className="w-full">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread" className="relative">
            Unread
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <Button variant="ghost" size="sm" onClick={onMarkAllRead} className="text-xs">
          Mark all read
        </Button>
      </div>

      <div className="max-h-[400px] overflow-auto">
        <TabsContent value="all" className="m-0 p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <NotificationList 
              notifications={notifications} 
              onMarkRead={onMarkRead} 
            />
          )}
        </TabsContent>
        
        <TabsContent value="unread" className="m-0 p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <NotificationList 
              notifications={unreadNotifications} 
              onMarkRead={onMarkRead} 
            />
          )}
        </TabsContent>
        
        <TabsContent value="alerts" className="m-0 p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <NotificationList 
              notifications={alertNotifications} 
              onMarkRead={onMarkRead} 
            />
          )}
        </TabsContent>
      </div>
      
      {onViewAll && (
        <div className="p-2 border-t">
          <Button 
            onClick={onViewAll} 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
          >
            View all notifications
          </Button>
        </div>
      )}
    </Tabs>
  );
};

export default NotificationTabs;
