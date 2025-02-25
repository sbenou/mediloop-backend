
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import NotificationItem, { Notification } from "./NotificationItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface NotificationTabsProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const NotificationTabs = ({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
}: NotificationTabsProps) => {
  const [currentTab, setCurrentTab] = useState<"all" | "alerts">("all");
  const navigate = useNavigate();
  
  // Filter alerts (payment failures, delivery issues)
  const alerts = notifications.filter(
    (notif) =>
      notif.type === "payment_failed" || 
      notif.type === "delivery_late" || 
      notif.type === "delivery_failed"
  );
  
  // All other notifications
  const allNotifications = currentTab === "all" 
    ? notifications 
    : alerts;

  const handleTabChange = (value: string) => {
    setCurrentTab(value as "all" | "alerts");
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center p-3 border-b">
        <h3 className="font-semibold">Notifications</h3>
        <Button variant="ghost" size="sm" onClick={onMarkAllRead} disabled={unreadCount === 0}>
          Mark all as read
        </Button>
      </div>
      
      <Tabs defaultValue="all" onValueChange={handleTabChange}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="py-2">
          <ScrollArea className="h-[400px] px-3">
            {allNotifications.length > 0 ? (
              allNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={onMarkRead}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No notifications</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="alerts" className="py-2">
          <ScrollArea className="h-[400px] px-3">
            {alerts.length > 0 ? (
              alerts.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={onMarkRead}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No alerts</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
      
      <div className="p-3 border-t">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate("/notifications")}
        >
          View all notifications
        </Button>
      </div>
    </div>
  );
};

export default NotificationTabs;
