
import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationTabs from "./notifications/NotificationTabs";
import { useNavigate } from "react-router-dom";
import { useFirebaseNotificationContext } from "@/providers/FirebaseNotificationProvider";
import { registerFCMToken } from "@/utils/firebaseNotificationUtils";

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    setupRealtimeSubscription 
  } = useNotifications();
  
  const { fcmToken, initializeNotifications } = useFirebaseNotificationContext();
  
  // Use ref to track initialization
  const hasInitialized = useRef(false);
  const errorCountRef = useRef(0);

  // Fetch notifications when authenticated - only once
  useEffect(() => {
    if (isAuthenticated && !hasInitialized.current) {
      console.log("NotificationBell: Initial data fetch");
      
      const fetchData = async () => {
        try {
          await fetchNotifications();
        } catch (err) {
          console.error("NotificationBell: Error fetching initial data", err);
          if (errorCountRef.current < 3) {
            errorCountRef.current++;
            // Retry with exponential backoff
            setTimeout(fetchData, 1000 * Math.pow(2, errorCountRef.current));
          }
        }
      };
      
      fetchData();
      hasInitialized.current = true;
      
      // Only set up subscription once
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [isAuthenticated, fetchNotifications, setupRealtimeSubscription]);

  // Register FCM token with backend when available - moved to non-blocking
  useEffect(() => {
    if (isAuthenticated && user?.id && fcmToken) {
      // Don't await this - make it non-blocking
      registerFCMToken(user.id, fcmToken).then(success => {
        if (success) {
          console.log("FCM token registered with backend");
        }
      }).catch(error => {
        console.error("Error registering FCM token:", error);
        // Continue even if token registration fails
      });
    }
  }, [isAuthenticated, user?.id, fcmToken]);

  // Request notification permission if authenticated and not already initialized
  useEffect(() => {
    if (isAuthenticated && !fcmToken) {
      // Use timeout to make this non-blocking
      setTimeout(() => {
        initializeNotifications().catch(err => {
          console.error("Error initializing notifications (non-critical):", err);
          // Continue even if initialization fails
        });
      }, 1000);
    }
  }, [isAuthenticated, fcmToken, initializeNotifications]);

  // Navigate to notifications view
  const handleViewAllClick = () => {
    setIsOpen(false);
    navigate("/notifications", { 
      state: { preserveAuth: true, keepSidebar: true }
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-primary hover:text-primary/80 transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[360px] p-0 bg-white z-[9999]">
        <NotificationTabs
          notifications={notifications}
          unreadCount={unreadCount}
          isLoading={isLoading}
          onMarkRead={markAsRead}
          onMarkAllRead={markAllAsRead}
          onViewAll={handleViewAllClick}
        />
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
