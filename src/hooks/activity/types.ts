
import { Activity } from '@/components/activity/ActivityItem';

// Define type for activities table in Supabase
export interface ActivitiesResponse {
  id: string; // Using string for UUID compatibility
  user_id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  created_at: string;
  updated_at: string;
  meta?: any;
  team_id?: string;
  tenant_id?: string;
  related_id?: string;
  related_type?: string;
  deleted_at?: string | null;
}

export interface UseActivitiesReturn {
  activities: Activity[];
  isLoading: boolean;
  error: Error | null;
  unreadCount: number;
  fetchActivities: () => Promise<void>;
  refreshActivities: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setupRealtimeSubscription: () => () => void;
}
