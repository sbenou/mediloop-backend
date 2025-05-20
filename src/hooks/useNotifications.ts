
import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types/supabase';
import { toast } from '@/components/ui/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { useTenantSupabase } from './useTenantSupabase';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentTenant } = useTenant();
  const { tenantTable } = useTenantSupabase();

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      let response;
      
      if (currentTenant) {
        // Fetch notifications from tenant schema
        response = await tenantTable<Notification>('notifications')
          .select('*')
          .filter('deleted_at', 'is', null)
          .order('created_at', { ascending: false });
      } else {
        // Fetch notifications from public schema
        response = await supabase
          .from('notifications')
          .select('*')
          .filter('deleted_at', 'is', null)
          .order('created_at', { ascending: false });
      }

      const { data, error } = response;

      if (error) {
        throw error;
      }

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant, tenantTable]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      if (currentTenant) {
        // Use tenant schema for marking read
        const { error } = await tenantTable<Notification>('notifications')
          .update({ read: true })
          .match({ id });
          
        if (error) throw error;
      } else {
        // Use public schema function
        const { error } = await supabase.rpc('mark_notification_read', {
          notification_id: id
        });
        
        if (error) throw error;
      }

      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      setUnreadCount((prevCount) => Math.max(0, prevCount - 1));

      toast({
        title: 'Notification marked as read',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  }, [currentTenant, tenantTable]);

  const markAllAsRead = useCallback(async () => {
    try {
      if (currentTenant) {
        // Use tenant schema for marking all read
        const { error } = await tenantTable<Notification>('notifications')
          .update({ read: true })
          .match({ read: false });
          
        if (error) throw error;
      } else {
        // Use public schema function
        const { error } = await supabase.rpc('mark_all_notifications_read');
        
        if (error) throw error;
      }

      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({ ...notification, read: true }))
      );
      setUnreadCount(0);

      toast({
        title: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    }
  }, [currentTenant, tenantTable]);

  const setupRealtimeSubscription = useCallback(() => {
    // If we have a tenant, subscribe to tenant-specific table
    if (currentTenant?.schema) {
      const tenantChannel = supabase
        .channel(`${currentTenant.schema}_notifications`)
        .on('postgres_changes', {
          event: '*',
          schema: currentTenant.schema,
          table: 'notifications'
        }, (payload) => {
          console.log('Tenant notification change:', payload);
          fetchNotifications();
        })
        .subscribe();
        
      return () => { supabase.removeChannel(tenantChannel); };
    } else {
      // Default public schema subscription
      const channel = supabase
        .channel('notifications_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications'
        }, (payload) => {
          fetchNotifications();
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [currentTenant, fetchNotifications]);

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
