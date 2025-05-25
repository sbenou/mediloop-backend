
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
  
  const { fcmToken } = useFirebaseNotificationContext();
  
  // Use refs to track initialization and prevent multiple setups
  const hasInitializedData = useRef(false);
  const fcmTokenRegistered = useRef(false);
  const subscriptionCleanup = useRef<(() => void) | null>(null);

  // Fetch notifications and set up realtime subscription when authenticated - only once
  useEffect(() => {
    if (isAuthenticated && !hasInitializedData.current) {
      console.log("NotificationBell: Initial data fetch and subscription setup");
      hasInitializedData.current = true;
      
      const fetchData = async () => {
        try {
          await fetchNotifications();
        } catch (err) {
          console.error("NotificationBell: Error fetching initial data", err);
        }
      };
      
      fetchData();
      
      // Set up subscription once
      subscriptionCleanup.current = setupRealtimeSubscription();
    }
    
    // Reset when user logs out
    if (!isAuthenticated) {
      hasInitializedData.current = false;
      fcmTokenRegistered.current = false;
      if (subscriptionCleanup.current) {
        subscriptionCleanup.current();
        subscriptionCleanup.current = null;
      }
    }
    
    return () => {
      if (!isAuthenticated && subscriptionCleanup.current) {
        subscriptionCleanup.current();
        subscriptionCleanup.current = null;
      }
    };
  }, [isAuthenticated, fetchNotifications, setupRealtimeSubscription]);

  // Register FCM token with backend when available - only once per token
  useEffect(() => {
    if (isAuthenticated && user?.id && fcmToken && !fcmTokenRegistered.current) {
      fcmTokenRegistered.current = true;
      
      // Register token with backend for targeted notifications
      registerFCMToken(user.id, fcmToken).then(success => {
        if (success) {
          console.log("FCM token registered with backend for targeted notifications");
        }
      }).catch(error => {
        console.error("Error registering FCM token:", error);
        fcmTokenRegistered.current = false; // Allow retry on next render
      });
    }
    
    // Reset registration flag when token changes or user logs out
    if (!fcmToken || !isAuthenticated) {
      fcmTokenRegistered.current = false;
    }
  }, [isAuthenticated, user?.id, fcmToken]);

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
