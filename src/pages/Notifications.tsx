
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationItem from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { seedUserNotifications } from "@/utils/seedNotifications";
import { toast } from "@/components/ui/use-toast";

const Notifications = () => {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    setupRealtimeSubscription,
  } = useNotifications();
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [user, fetchNotifications, setupRealtimeSubscription]);

  const handleSeedNotifications = async () => {
    if (!user) return;
    
    setIsSeeding(true);
    try {
      await seedUserNotifications(user.id);
      toast({
        title: "Notifications seeded",
        description: "Test notifications have been added to your account",
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error seeding notifications:", error);
      toast({
        title: "Error",
        description: "Failed to seed notifications",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const alerts = notifications.filter(
    (notif) =>
      notif.type === "payment_failed" ||
      notif.type === "delivery_late" ||
      notif.type === "delivery_failed"
  );

  const renderContent = (items: typeof notifications) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading notifications...</span>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No notifications</p>
        </div>
      );
    }

    return items.map((notification) => (
      <NotificationItem
        key={notification.id}
        notification={notification}
        onMarkRead={markAsRead}
      />
    ));
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <div className="flex space-x-2">
          {process.env.NODE_ENV === "development" && (
            <Button onClick={handleSeedNotifications} disabled={isSeeding}>
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding...
                </>
              ) : (
                "Seed Test Notifications"
              )}
            </Button>
          )}
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            Mark all as read
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-6 space-y-4">
              {renderContent(notifications)}
            </TabsContent>
            <TabsContent value="alerts" className="mt-6 space-y-4">
              {renderContent(alerts)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
