
import { useCallback, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity } from '@/components/activity/ActivityItem';
import { ActivitiesResponse } from './types';

export const useActivitiesFetch = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching activities...");
      
      // Modified query - removed the is("deleted_at", null) condition since the column doesn't exist
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedActivities: Activity[] = (data || []).map((item: ActivitiesResponse) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        timestamp: new Date(item.timestamp),
        read: item.read,
        meta: item.meta || {}
      }));

      setActivities(formattedActivities);
      setUnreadCount(formattedActivities.filter(a => !a.read).length);
      lastFetchTimeRef.current = Date.now();
      
      console.log(`Fetched ${formattedActivities.length} activities, ${formattedActivities.filter(a => !a.read).length} unread`);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    activities,
    setActivities,
    isLoading,
    error,
    unreadCount,
    setUnreadCount,
    lastFetchTime: lastFetchTimeRef.current,
    fetchActivities
  };
};
