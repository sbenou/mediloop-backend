
import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationTabs from '@/components/notifications/NotificationTabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

interface NotificationsViewProps {
  userRole?: string;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ userRole }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    setupRealtimeSubscription
  } = useNotifications();

  // Fetch notifications when the component mounts
  useEffect(() => {
    fetchNotifications();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [fetchNotifications, setupRealtimeSubscription]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6">
          <NotificationTabs
            notifications={notifications}
            unreadCount={unreadCount}
            isLoading={isLoading}
            onMarkRead={markAsRead}
            onMarkAllRead={markAllAsRead}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationsView;
