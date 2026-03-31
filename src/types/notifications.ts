/** App notification model (Neon/API-backed where integrated). */

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
  meta?: Record<string, unknown>;
  deleted_at?: string | null;
  timestamp?: string | Date;
  description?: string;
}
