
export interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp?: string;
  date?: string;
  user_id?: string;
  status?: 'read' | 'unread';
  read?: boolean;  // Add this to support both status and read property access patterns
  metadata?: Record<string, any>;
  image_url?: string;
  icon?: string;
  action?: {
    text: string;
    url: string;
  };
}

export interface ActivitiesResponse {
  data: Activity[];
  hasMore: boolean;
}

export interface ActivityGroup {
  date: string;
  activities: Activity[];
}
