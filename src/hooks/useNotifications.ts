
import { useState, useEffect, useCallback, useRef } from "react";
import { Notification } from "@/types/domain";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  fetchNotificationHistoryApi,
  markNotificationReadApi,
  type ApiNotificationRow,
  type NotificationInboxScope,
} from "@/services/notificationsApi";

function mapApiRow(row: ApiNotificationRow, userId: string): Notification {
  const data =
    row.data != null && typeof row.data === "object" && !Array.isArray(row.data)
      ? (row.data as Record<string, unknown>)
      : {};
  const type =
    typeof data.type === "string" && data.type.length > 0 ? data.type : "general";
  return {
    id: row.id,
    user_id: userId,
    type,
    title: row.title,
    message: row.body,
    read: row.read_at != null,
    created_at: row.sent_at || "",
    meta: data,
  };
}

export interface NotificationHookReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  setupRealtimeSubscription: () => (() => void) | null;
}

/** Optional `inbox` scopes fetch + mark-read to the same surface as the backend (e.g. professional_personal). */
export const useNotifications = (inbox?: NotificationInboxScope): NotificationHookReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const count = notifications.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const rows = await fetchNotificationHistoryApi(user.id, 50, inbox);
      setNotifications(rows.map((r) => mapApiRow(r, user.id)));
    } catch (error) {
      console.error("Error in fetchNotifications:", error);
      toast({
        title: "Error loading notifications",
        description: "Could not load your notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, inbox]);

  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      await markNotificationReadApi(id, inbox);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }, [inbox]);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return false;

    try {
      await Promise.all(unreadIds.map((id) => markNotificationReadApi(id, inbox)));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast({ title: "All notifications marked as read", variant: "default" });
      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({
        title: "Error",
        description: "Could not mark notifications as read",
        variant: "destructive",
      });
      return false;
    }
  }, [user?.id, notifications, inbox]);

  /** Poll API; Supabase Realtime removed (Neon has no equivalent channel here). */
  const setupRealtimeSubscription = useCallback((): (() => void) | null => {
    if (!user?.id) return null;
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }
    pollRef.current = setInterval(() => {
      fetchNotifications();
    }, 60_000);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [user?.id, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    setupRealtimeSubscription,
  };
};
