
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Notification } from "@/types/supabase"; 
import NotificationList from "./NotificationList";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertTriangle } from "lucide-react";

interface NotificationTabsProps {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasError?: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onViewAll?: () => void;
  onRetry?: () => void;
}

const NotificationTabs = ({
  notifications,
  unreadCount,
  isLoading,
  hasError = false,
  onMarkRead,
  onMarkAllRead,
  onViewAll,
  onRetry
}: NotificationTabsProps) => {
  const unreadNotifications = notifications.filter(notification => !notification.read);
  const alertNotifications = notifications.filter(notification => 
    ['payment_failed', 'delivery_failed', 'delivery_late'].includes(notification.type)
  );

  const renderContent = (notificationsToRender: Notification[]) => {
    if (hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
          <p className="text-muted-foreground mb-3">Failed to load notifications</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      );
    }
    
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    return <NotificationList notifications={notificationsToRender} onMarkRead={onMarkRead} />;
  };

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
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onMarkAllRead} 
          className="text-xs"
          disabled={isLoading || hasError || unreadCount === 0}
        >
          Mark all read
        </Button>
      </div>

      <div className="max-h-[400px] overflow-auto">
        <TabsContent value="all" className="m-0 p-0">
          {renderContent(notifications)}
        </TabsContent>
        
        <TabsContent value="unread" className="m-0 p-0">
          {renderContent(unreadNotifications)}
        </TabsContent>
        
        <TabsContent value="alerts" className="m-0 p-0">
          {renderContent(alertNotifications)}
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
