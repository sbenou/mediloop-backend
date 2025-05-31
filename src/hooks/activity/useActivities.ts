import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Activity } from './types';

export const useActivities = (userId?: string, limit = 10) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Calculate unread count from activities
  const unreadCount = useMemo(() => {
    return activities.filter(activity => !activity.read && activity.status !== 'read').length;
  }, [activities]);

  const fetchActivities = async (userId?: string, startFrom = 0) => {
    if (!userId) return [];
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(startFrom, startFrom + limit - 1);
      
      if (error) throw error;
      
      // If we got fewer results than the limit, there are no more to fetch
      setHasMore(data.length === limit);
      
      // Add read property based on status
      const processedData = data.map(item => ({
        ...item,
        read: item.status === 'read'
      }));
      
      // If this is the first page, replace the state
      // Otherwise append to the existing activities
      if (startFrom === 0) {
        setActivities(processedData);
      } else {
        setActivities(prev => [...prev, ...processedData]);
      }
      
      return processedData;
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
      toast({
        title: 'Error loading activities',
        description: 'Could not load your recent activities',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreActivities = () => {
    if (!userId || !hasMore || isLoading) return Promise.resolve([]);
    return fetchActivities(userId, activities.length);
  };

  const markAsRead = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('activities')
        .update({ status: 'read' })
        .eq('id', activityId);

      if (error) throw error;

      // Update the local state
      setActivities(prev =>
        prev.map(activity =>
          activity.id === activityId ? { ...activity, status: 'read', read: true } : activity
        )
      );
      
      return true;
    } catch (err) {
      console.error('Error marking activity as read:', err);
      return false;
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return Promise.resolve(false);
    
    try {
      const unreadActivityIds = activities
        .filter(activity => activity.status !== 'read' || !activity.read)
        .map(activity => activity.id);
      
      if (unreadActivityIds.length === 0) return false;
      
      const { error } = await supabase
        .from('activities')
        .update({ status: 'read' })
        .in('id', unreadActivityIds);

      if (error) throw error;

      // Update the local state
      setActivities(prev =>
        prev.map(activity => ({ ...activity, status: 'read', read: true }))
      );
      
      toast({
        title: 'All activities marked as read',
        variant: 'success',
      });
      
      return true;
    } catch (err) {
      console.error('Error marking all activities as read:', err);
      toast({
        title: 'Error',
        description: 'Could not mark activities as read',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Load activities when the component mounts or userId changes
  useEffect(() => {
    if (userId) {
      fetchActivities(userId);
    } else {
      setActivities([]);
      setIsLoading(false);
    }
  }, [userId]);

  return {
    activities,
    isLoading,
    error,
    hasMore,
    unreadCount,
    loadMoreActivities,
    markAsRead,
    markAllAsRead,
    refreshActivities: () => userId ? fetchActivities(userId) : Promise.resolve([]),
    fetchActivities
  };
};
