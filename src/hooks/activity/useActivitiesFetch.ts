
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Activity, ActivitiesResponse } from "./types";

// Helper to convert Supabase activities to our Activity type
const mapActivities = (activities: any[]): Activity[] => {
  return activities.map(activity => ({
    id: activity.id,
    type: activity.type || 'notification',
    title: activity.title || '',
    description: activity.description || '',
    timestamp: activity.created_at,
    date: activity.created_at ? new Date(activity.created_at).toISOString().split('T')[0] : '',
    user_id: activity.user_id,
    status: activity.status || 'unread',
    metadata: activity.metadata || {},
    image_url: activity.image_url,
    icon: activity.icon,
    action: activity.action
  }));
};

export const useActivitiesFetch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 20;

  // Load activities from Supabase
  const fetchActivities = useCallback(async (userId: string = '', page: number = 0) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);
        
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const mappedActivities = mapActivities(data || []);
      
      // If we got fewer results than the limit, we've reached the end
      setHasMore(data && data.length === limit);
      
      return mappedActivities;
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load more activities
  const loadMoreActivities = useCallback(async () => {
    if (!hasMore || isLoading) return [];
    
    const nextPage = page + 1;
    const newActivities = await fetchActivities('', nextPage);
    
    if (newActivities.length > 0) {
      setActivities(prev => [...prev, ...newActivities]);
      setPage(nextPage);
    }
    
    return newActivities;
  }, [fetchActivities, hasMore, isLoading, page]);
  
  // Initialize activities
  const initializeActivities = useCallback(async (userId: string = '') => {
    const initialActivities = await fetchActivities(userId);
    setActivities(initialActivities);
    setPage(0);
    return initialActivities;
  }, [fetchActivities]);
  
  // Mark an activity as read
  const markAsRead = useCallback(async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', activityId);
        
      if (error) throw error;
      
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityId 
            ? { ...activity, status: 'read' } 
            : activity
        )
      );
      
      return true;
    } catch (err) {
      console.error('Error marking activity as read:', err);
      return false;
    }
  }, []);
  
  // Mark all activities as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('status', 'unread');
        
      if (error) throw error;
      
      setActivities(prev => 
        prev.map(activity => ({ ...activity, status: 'read' }))
      );
      
      return true;
    } catch (err) {
      console.error('Error marking all activities as read:', err);
      return false;
    }
  }, []);
  
  // Refresh activities
  const refreshActivities = useCallback(async () => {
    setPage(0);
    return initializeActivities();
  }, [initializeActivities]);

  return {
    activities,
    isLoading,
    error,
    hasMore,
    loadMoreActivities,
    markAsRead,
    markAllAsRead,
    refreshActivities,
    fetchActivities: initializeActivities
  };
};
