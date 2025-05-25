
import { useCallback, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types/supabase';
import { toast } from '@/components/ui/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { useTenantSupabase } from './useTenantSupabase';
import { useAuth } from '@/hooks/auth/useAuth';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const { currentTenant } = useTenant();
  const { tenantTable } = useTenantSupabase();
  const { user } = useAuth();
  
  // Use refs to prevent infinite loops
  const isFetching = useRef(false);
  const lastFetchTime = useRef(0);
  const subscriptionSetup = useRef(false);
  const FETCH_COOLDOWN = 2000; // 2 seconds between fetches

  // Function to fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID available for fetching notifications');
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Prevent multiple simultaneous fetches
    if (isFetching.current) {
      console.log('Fetch already in progress, skipping...');
      return;
    }
    
    // Rate limiting - don't fetch too frequently
    const now = Date.now();
    if (now - lastFetchTime.current < FETCH_COOLDOWN) {
      console.log('Fetch rate limited, skipping...');
      return;
    }
    
    isFetching.current = true;
    lastFetchTime.current = now;
    setIsLoading(true);
    
    try {
      console.log('Fetching notifications for user:', user.id);
      let response;
      
      if (currentTenant) {
        // Fetch notifications from tenant schema
        response = await tenantTable<Notification>('notifications')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });
      } else {
        // Fetch notifications from public schema
        response = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });
      }

      const { data, error } = response;

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      if (data) {
        console.log('Fetched notifications:', data);
        setNotifications(data);
        const unread = data.filter(n => !n.read).length;
        setUnreadCount(unread);
        console.log('Unread count:', unread);
        setFetchError(null);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setFetchError(error as Error);
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [currentTenant, tenantTable, user?.id]);

  // Clear fetch error when dependencies change
  useEffect(() => {
    setFetchError(null);
  }, [currentTenant, tenantTable]);

  const markAsRead = useCallback(async (id: string) => {
    if (!user?.id) return;

    try {
      if (currentTenant) {
        // Use tenant schema for marking read
        const { error } = await tenantTable<Notification>('notifications')
          .update({ read: true })
          .eq('id', id)
          .eq('user_id', user.id);
          
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
  }, [currentTenant, tenantTable, user?.id]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      if (currentTenant) {
        // Use tenant schema for marking all read
        const { error } = await tenantTable<Notification>('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false);
          
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
  }, [currentTenant, tenantTable, user?.id]);

  const setupRealtimeSubscription = useCallback(() => {
    if (!user?.id) {
      console.log('No user ID for realtime subscription');
      return () => {};
    }

    if (subscriptionSetup.current) {
      console.log('Subscription already set up, skipping...');
      return () => {};
    }
    
    subscriptionSetup.current = true;
    let channelToCleanup = null;
    
    console.log('Setting up realtime subscription for notifications, user:', user.id);
    
    // If we have a tenant, subscribe to tenant-specific table
    if (currentTenant?.schema) {
      const tenantChannel = supabase
        .channel(`${currentTenant.schema}_notifications_${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: currentTenant.schema,
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          console.log('Tenant notification change for user:', user.id, payload);
          // Immediate refresh for better UX
          setTimeout(() => {
            fetchNotifications();
          }, 500);
        })
        .subscribe((status) => {
          console.log(`Tenant notification channel status: ${status}`);
        });
        
      channelToCleanup = tenantChannel;
    } else {
      // Default public schema subscription
      const channel = supabase
        .channel(`notifications_changes_${user.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          console.log('Public notification change for user:', user.id, payload);
          // Immediate refresh for better UX
          setTimeout(() => {
            fetchNotifications();
          }, 500);
        })
        .subscribe((status) => {
          console.log(`Public notification channel status: ${status}`);
        });

      channelToCleanup = channel;  
    }
    
    return () => { 
      if (channelToCleanup) {
        console.log('Cleaning up notification subscription');
        supabase.removeChannel(channelToCleanup);
      }
      subscriptionSetup.current = false;
    };
  }, [currentTenant, fetchNotifications, user?.id]);

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    setupRealtimeSubscription,
    fetchError
  };
};
