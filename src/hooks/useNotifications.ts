
import { useCallback, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types/supabase';
import { toast } from '@/components/ui/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import { useTenantSupabase } from './useTenantSupabase';
import { setupMessageListener } from '@/lib/firebase';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const { currentTenant } = useTenant();
  const { tenantTable } = useTenantSupabase();
  
  // Use refs to prevent infinite loops
  const isFetching = useRef(false);
  const lastFetchTime = useRef(0);
  const FETCH_COOLDOWN = 2000; // 2 seconds between fetches

  // Function to fetch notifications from database
  const fetchNotifications = useCallback(async () => {
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
      let response;
      
      if (currentTenant) {
        // Fetch notifications from tenant schema
        response = await tenantTable<Notification>('notifications')
          .select('*')
          .eq('deleted_at', null)
          .order('created_at', { ascending: false });
      } else {
        // Fetch notifications from public schema
        response = await supabase
          .from('notifications')
          .select('*')
          .eq('deleted_at', null)
          .order('created_at', { ascending: false });
      }

      const { data, error } = response;

      if (error) {
        throw error;
      }

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
        setFetchError(null);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setFetchError(error as Error);
      // Don't show toast for initial fetch to prevent error loops
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, [currentTenant, tenantTable]);

  // Clear fetch error when dependencies change
  useEffect(() => {
    setFetchError(null);
  }, [currentTenant, tenantTable]);

  // Setup listener for Firebase notifications to trigger a refetch - with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const unsubscribe = setupMessageListener((payload) => {
      console.log('Firebase notification received, scheduling refresh...');
      
      // Debounce the refresh to prevent multiple rapid calls
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetchNotifications();
      }, 1000); // 1 second delay
    });
    
    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      if (currentTenant) {
        // Use tenant schema for marking read
        const { error } = await tenantTable<Notification>('notifications')
          .update({ read: true })
          .eq('id', id);
          
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
  }, [currentTenant, tenantTable]);

  const setupRealtimeSubscription = useCallback(() => {
    let channelToCleanup = null;
    
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
          // Use setTimeout with longer delay to prevent potential deadlocks
          setTimeout(() => {
            fetchNotifications();
          }, 1500);
        })
        .subscribe((status) => {
          console.log(`Tenant notification channel status: ${status}`);
        });
        
      channelToCleanup = tenantChannel;
    } else {
      // Default public schema subscription
      const channel = supabase
        .channel('notifications_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications'
        }, (payload) => {
          console.log('Public notification change:', payload);
          // Use setTimeout with longer delay to prevent potential deadlocks
          setTimeout(() => {
            fetchNotifications();
          }, 1500);
        })
        .subscribe((status) => {
          console.log(`Public notification channel status: ${status}`);
        });

      channelToCleanup = channel;  
    }
    
    return () => { 
      if (channelToCleanup) {
        supabase.removeChannel(channelToCleanup);
      }
    };
  }, [currentTenant, fetchNotifications]);

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
