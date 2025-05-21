
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
  const { isAuthenticated } = useAuth();
  
  // Refs for tracking subscription status
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const hasSubscribed = useRef(false);
  const abortController = useRef<AbortController | null>(null);

  // Function to fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      return;
    }
    
    // Cancel any in-progress fetch
    if (abortController.current) {
      abortController.current.abort();
    }
    
    // Create new abort controller for this request
    abortController.current = new AbortController();
    
    setIsLoading(true);
    try {
      console.log("Fetching notifications...", { tenant: currentTenant?.name || 'public' });
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

      console.log("Notifications fetched:", data?.length || 0);
      
      if (data) {
        setNotifications(data);
        const unread = data.filter(n => !n.read).length;
        setUnreadCount(unread);
        console.log(`Found ${unread} unread notifications`);
        setFetchError(null);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setFetchError(error as Error);
      // Show toast only for network errors, not for cancellations
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load notifications"
        });
      }
    } finally {
      setIsLoading(false);
      abortController.current = null;
    }
  }, [isAuthenticated, currentTenant, tenantTable]);

  // Clear fetch error when dependencies change
  useEffect(() => {
    setFetchError(null);
  }, [currentTenant, tenantTable, isAuthenticated]);

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
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark notification as read"
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
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark all notifications as read"
      });
    }
  }, [currentTenant, tenantTable]);

  const setupRealtimeSubscription = useCallback(() => {
    // If already subscribed, don't do it again
    if (hasSubscribed.current) {
      console.log("Notification subscription already active");
      return () => {};
    }
    
    console.log("Setting up notification subscription");
    
    // Clean up any existing channel before creating a new one
    if (channelRef.current) {
      console.log("Cleaning up existing notification channel");
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    // If we have a tenant, subscribe to tenant-specific table
    if (currentTenant?.schema) {
      console.log(`Setting up tenant notification channel for ${currentTenant.schema}`);
      const tenantChannel = supabase
        .channel(`${currentTenant.schema}_notifications`)
        .on('postgres_changes', {
          event: '*',
          schema: currentTenant.schema,
          table: 'notifications'
        }, (payload) => {
          console.log('Tenant notification change:', payload);
          // Use setTimeout to prevent potential deadlocks with Supabase client
          setTimeout(() => {
            fetchNotifications();
          }, 100);
        })
        .subscribe((status) => {
          console.log(`Tenant notification channel status: ${status}`);
          if (status === 'SUBSCRIBED') {
            hasSubscribed.current = true;
          }
        });
        
      channelRef.current = tenantChannel;
    } else {
      // Default public schema subscription
      console.log("Setting up public notification channel");
      const channel = supabase
        .channel('notifications_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications'
        }, (payload) => {
          console.log('Public notification change:', payload);
          // Use setTimeout to prevent potential deadlocks with Supabase client
          setTimeout(() => {
            fetchNotifications();
          }, 100);
        })
        .subscribe((status) => {
          console.log(`Public notification channel status: ${status}`);
          if (status === 'SUBSCRIBED') {
            hasSubscribed.current = true;
          }
        });

      channelRef.current = channel;  
    }
    
    return () => { 
      if (channelRef.current) {
        console.log("Cleaning up notification subscription");
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        hasSubscribed.current = false;
      }
    };
  }, [currentTenant, fetchNotifications]);
  
  // Clean up subscription when component unmounts or tenant changes
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        console.log("Component unmounting - cleaning up notification subscription");
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        hasSubscribed.current = false;
      }
      
      // Also abort any pending fetch
      if (abortController.current) {
        abortController.current.abort();
        abortController.current = null;
      }
    };
  }, [currentTenant]);

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
