
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types/supabase';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/auth/useAuth';

export interface NotificationHookReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  setupRealtimeSubscription: () => (() => void) | null;
}

export const useNotifications = (): NotificationHookReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  // Use refs to prevent multiple subscriptions
  const subscriptionRef = useRef<any>(null);
  const hasSetupSubscription = useRef(false);

  // Calculate unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(notification => !notification.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID available for fetching notifications');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Fetching notifications for user:', user.id);
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      console.log('Fetched notifications:', data?.length || 0);
      
      // Transform the data to match the Notification interface
      const transformedNotifications: Notification[] = (data || []).map(item => ({
        ...item,
        meta: item.meta as Record<string, any> || {}
      }));
      
      setNotifications(transformedNotifications);
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
      toast({
        title: 'Error loading notifications',
        description: 'Could not load your notifications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const unreadNotificationIds = notifications
        .filter(notification => !notification.read)
        .map(notification => notification.id);
      
      if (unreadNotificationIds.length === 0) return false;
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadNotificationIds);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      toast({
        title: 'All notifications marked as read',
        variant: 'default',
      });
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Could not mark notifications as read',
        variant: 'destructive',
      });
      return false;
    }
  }, [user?.id, notifications]);

  const setupRealtimeSubscription = useCallback(() => {
    if (!user?.id || hasSetupSubscription.current) {
      console.log('Skipping subscription setup - no user or already setup');
      return null;
    }

    console.log('Setting up realtime subscription for notifications');
    hasSetupSubscription.current = true;

    try {
      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Realtime notification update:', payload);
            
            if (payload.eventType === 'INSERT') {
              const newNotification = {
                ...payload.new,
                meta: payload.new.meta as Record<string, any> || {}
              } as Notification;
              setNotifications(prev => [newNotification, ...prev]);
              
              toast({
                title: newNotification.title,
                description: newNotification.message,
                variant: 'default',
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedNotification = {
                ...payload.new,
                meta: payload.new.meta as Record<string, any> || {}
              } as Notification;
              setNotifications(prev =>
                prev.map(notification =>
                  notification.id === updatedNotification.id ? updatedNotification : notification
                )
              );
            } else if (payload.eventType === 'DELETE') {
              const deletedId = payload.old.id;
              setNotifications(prev => prev.filter(notification => notification.id !== deletedId));
            }
          }
        )
        .subscribe();

      subscriptionRef.current = channel;

      // Return cleanup function
      return () => {
        console.log('Cleaning up notification subscription');
        if (subscriptionRef.current) {
          supabase.removeChannel(subscriptionRef.current);
          subscriptionRef.current = null;
        }
        hasSetupSubscription.current = false;
      };
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
      hasSetupSubscription.current = false;
      return null;
    }
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    setupRealtimeSubscription
  };
};
