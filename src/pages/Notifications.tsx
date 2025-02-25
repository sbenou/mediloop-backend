
import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NotificationItem, { Notification, NotificationType } from "@/components/notifications/NotificationItem";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/auth/useAuth";

const Notifications = () => {
  const { profile } = useAuth();
  const [currentTab, setCurrentTab] = useState<"all" | "alerts" | "unread">("all");
  
  // This would normally be fetched from the database
  // For now, we'll use mock data
  const mockNotifications: Notification[] = [
    {
      id: "1",
      type: "payment_successful" as NotificationType,
      title: "Payment Successful",
      message: "Your payment for order #ORD-2023-001 has been processed",
      read: false,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: "2",
      type: "delivery_incoming" as NotificationType,
      title: "Delivery On The Way",
      message: "Your order #ORD-2023-001 is out for delivery",
      read: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "3",
      type: "prescription_created" as NotificationType,
      title: "New Prescription",
      message: "Dr. Smith has created a new prescription for you",
      read: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
  
  // Filter notifications based on current tab
  const filteredNotifications = mockNotifications.filter(notification => {
    if (currentTab === "all") return true;
    if (currentTab === "alerts") {
      return (
        notification.type === "payment_failed" || 
        notification.type === "delivery_late" || 
        notification.type === "delivery_failed"
      );
    }
    if (currentTab === "unread") {
      return !notification.read;
    }
    return true;
  });
  
  const handleMarkRead = (id: string) => {
    // In a real app, this would update the database
    console.log("Marking notification as read:", id);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Notifications</h1>
        
        <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as any)} className="mb-8">
          <TabsList className="grid w-full md:w-auto grid-cols-3 md:inline-flex">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            {filteredNotifications.length > 0 ? (
              <div className="space-y-4">
                {filteredNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No notifications</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="unread" className="mt-6">
            {filteredNotifications.length > 0 ? (
              <div className="space-y-4">
                {filteredNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No unread notifications</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="alerts" className="mt-6">
            {filteredNotifications.length > 0 ? (
              <div className="space-y-4">
                {filteredNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No alerts</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default Notifications;
