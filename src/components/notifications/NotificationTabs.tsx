
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import NotificationItem from "./NotificationItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Notification } from "@/types/supabase";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Helper function to get notification style based on type
const getNotificationStyle = (type: string) => {
  if (type === "payment_failed") {
    return "border-red-500 bg-red-50";
  } else if (type === "delivery_late" || type === "delivery_failed") {
    return "border-amber-500 bg-amber-50";
  } else if (type.includes("prescription")) {
    return "border-purple-500 bg-purple-50";
  } else if (type.includes("order")) {
    return "border-blue-500 bg-blue-50";
  } else if (type.includes("appointment") || type.includes("consultation")) {
    return "border-indigo-500 bg-indigo-50";
  } else if (type.includes("payment") || type.includes("billing")) {
    return "border-emerald-500 bg-emerald-50";
  } else if (type.includes("doctor") || type.includes("patient")) {
    return "border-teal-500 bg-teal-50";
  }
  
  return "border-gray-500 bg-gray-50";
};

interface NotificationTabsProps {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const NotificationTabs = ({
  notifications,
  unreadCount,
  isLoading,
  onMarkRead,
  onMarkAllRead,
}: NotificationTabsProps) => {
  const [activeTab, setActiveTab] = useState<"all" | "alerts">("all");
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const navigate = useNavigate();
  
  // Filter alerts (payment failures, delivery issues)
  const alerts = notifications.filter(
    (notif) =>
      notif.type === "payment_failed" || 
      notif.type === "delivery_late" || 
      notif.type === "delivery_failed"
  );
  
  // All other notifications
  const allNotifications = activeTab === "all" 
    ? notifications 
    : alerts;

  const handleTabChange = (value: string) => {
    setActiveTab(value as "all" | "alerts");
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === "list" ? "card" : "list");
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading notifications...</span>
        </div>
      );
    }

    if (allNotifications.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No {activeTab === "alerts" ? "alerts" : "notifications"}</p>
        </div>
      );
    }

    if (viewMode === "card") {
      return (
        <ScrollArea className="h-[400px]">
          <div className="grid grid-cols-1 gap-3 p-1">
            {allNotifications.map((notification) => {
              const borderColorClass = getNotificationStyle(notification.type);
              return (
                <Card 
                  key={notification.id}
                  className={cn(
                    "border-l-4 overflow-hidden",
                    borderColorClass,
                    notification.read ? "opacity-70" : ""
                  )}
                  onClick={() => !notification.read && onMarkRead(notification.id)}
                >
                  <div className="p-3">
                    <NotificationItem
                      notification={notification}
                      onMarkRead={onMarkRead}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      );
    }

    return (
      <ScrollArea className="h-[400px]">
        <div className="px-3">
          {allNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={onMarkRead}
            />
          ))}
        </div>
      </ScrollArea>
    );
  };

  // Navigate to the notifications view
  const handleViewAll = () => {
    navigate(`/notifications?view=notifications${activeTab === "alerts" ? "&alertsOnly=true" : ""}`);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center p-3 border-b">
        <h3 className="font-semibold">Notifications</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleViewMode} className="text-xs">
            {viewMode === "list" ? "Card View" : "List View"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onMarkAllRead} disabled={unreadCount === 0 || isLoading}>
            Mark all as read
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="py-2">
          {renderContent()}
        </TabsContent>
        
        <TabsContent value="alerts" className="py-2">
          {renderContent()}
        </TabsContent>
      </Tabs>
      
      <div className="p-3 border-t">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleViewAll}
        >
          View all {activeTab === "alerts" ? "alerts" : "notifications"}
        </Button>
      </div>
    </div>
  );
};

export default NotificationTabs;
