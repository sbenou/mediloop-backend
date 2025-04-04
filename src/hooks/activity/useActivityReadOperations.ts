
import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Activity } from '@/components/activity/ActivityItem';

interface UseActivityReadOperationsProps {
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

export function useActivityReadOperations({
  activities,
  setActivities,
  setUnreadCount
}: UseActivityReadOperationsProps) {
  
  const markAsRead = useCallback(async (id: string) => {
    try {
      console.log(`Marking activity ${id} as read`);
      // Use the explicit function call for the stored procedure
      const { error } = await supabase.rpc('mark_activity_read', {
        activity_id: id
      });

      if (error) {
        console.error("Error marking activity as read:", error);
        throw error;
      }

      // Update local state
      setActivities(prev => 
        prev.map(activity => 
          activity.id === id ? { ...activity, read: true } : activity
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      toast({
        title: 'Activity marked as read',
      });
    } catch (error) {
      console.error('Error marking activity as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark activity as read',
        variant: 'destructive',
      });
    }
  }, [setActivities, setUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    try {
      console.log("Marking all activities as read");
      // Use the explicit function call for the stored procedure
      const { error } = await supabase.rpc('mark_all_activities_read');

      if (error) {
        console.error("Error marking all activities as read:", error);
        throw error;
      }

      // Update local state
      setActivities(prev => 
        prev.map(activity => ({ ...activity, read: true }))
      );
      setUnreadCount(0);

      toast({
        title: 'All activities marked as read',
      });
    } catch (error) {
      console.error('Error marking all activities as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all activities as read',
        variant: 'destructive',
      });
    }
  }, [setActivities, setUnreadCount]);

  return {
    markAsRead,
    markAllAsRead
  };
}
