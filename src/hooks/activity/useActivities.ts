
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/auth/useAuth';

export interface Activity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: string;
  read: boolean;
  meta?: Record<string, any>;
}

export const useActivities = (limit: number = 10) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { profile } = useAuth();
  
  useEffect(() => {
    if (!profile?.id) {
      return;
    }
    
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', profile.id)
          .order('timestamp', { ascending: false })
          .limit(limit);
          
        if (error) throw error;
        
        setActivities(data || []);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
    
    // Set up subscription for real-time updates
    const subscription = supabase
      .channel('activities-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'activities',
        filter: `user_id=eq.${profile.id}`
      }, () => {
        fetchActivities();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [profile?.id, limit]);
  
  const markAsRead = async (activityId: string) => {
    try {
      const { error } = await supabase.rpc('mark_activity_read', { activity_id: activityId });
      
      if (error) throw error;
      
      // Update local state to reflect the change
      setActivities(prev => 
        prev.map(activity => 
          activity.id === activityId ? { ...activity, read: true } : activity
        )
      );
      
    } catch (err) {
      console.error('Error marking activity as read:', err);
      throw err;
    }
  };
  
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase.rpc('mark_all_activities_read');
      
      if (error) throw error;
      
      // Update local state to reflect all activities as read
      setActivities(prev => 
        prev.map(activity => ({ ...activity, read: true }))
      );
      
    } catch (err) {
      console.error('Error marking all activities as read:', err);
      throw err;
    }
  };
  
  return { 
    activities, 
    loading, 
    error, 
    markAsRead,
    markAllAsRead
  };
};

export default useActivities;
