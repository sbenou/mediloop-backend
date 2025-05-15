
export interface Activity {
  id: string;
  user_id: string;
  type: string;
  created_at: string;
  details: Record<string, any>;
  read?: boolean;
  title?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ActivityGroup {
  date: string;
  activities: Activity[];
}
