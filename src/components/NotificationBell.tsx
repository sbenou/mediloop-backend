
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
  const { isAuthenticated, user, userRole, isPharmacist } = useAuth();
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
  const dataInitTimeout = useRef<NodeJS.Timeout | null>(null);
  const tokenRegTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications and set up realtime subscription when authenticated - only once
  useEffect(() => {
    console.log('NotificationBell effect triggered:', { isAuthenticated, user: user?.id, hasInitialized: hasInitializedData.current });
    
    // Clear any pending initialization
    if (dataInitTimeout.current) {
      clearTimeout(dataInitTimeout.current);
      dataInitTimeout.current = null;
    }
    
    if (isAuthenticated && user?.id && !hasInitializedData.current) {
      console.log("NotificationBell: Initial data fetch and subscription setup for user:", user.id);
      hasInitializedData.current = true;
      
      // Add delay to ensure auth is fully settled
      dataInitTimeout.current = setTimeout(async () => {
        try {
          console.log("NotificationBell: Fetching initial notifications");
          await fetchNotifications();
          console.log("NotificationBell: Setting up realtime subscription");
          subscriptionCleanup.current = setupRealtimeSubscription();
        } catch (err) {
          console.error("NotificationBell: Error fetching initial data", err);
          hasInitializedData.current = false; // Allow retry
        }
      }, 1000);
    }
    
    // Reset when user logs out
    if (!isAuthenticated || !user?.id) {
      console.log("NotificationBell: Resetting state due to logout");
      hasInitializedData.current = false;
      fcmTokenRegistered.current = false;
      if (subscriptionCleanup.current) {
        subscriptionCleanup.current();
        subscriptionCleanup.current = null;
      }
      if (dataInitTimeout.current) {
        clearTimeout(dataInitTimeout.current);
        dataInitTimeout.current = null;
      }
    }
    
    return () => {
      if (!isAuthenticated && subscriptionCleanup.current) {
        subscriptionCleanup.current();
        subscriptionCleanup.current = null;
      }
    };
  }, [isAuthenticated, user?.id, fetchNotifications, setupRealtimeSubscription]);

  // Register FCM token with backend when available - only once per token
  useEffect(() => {
    // Clear any pending token registration
    if (tokenRegTimeout.current) {
      clearTimeout(tokenRegTimeout.current);
      tokenRegTimeout.current = null;
    }
    
    if (isAuthenticated && user?.id && fcmToken && !fcmTokenRegistered.current) {
      fcmTokenRegistered.current = true;
      
      // Add delay to prevent race conditions
      tokenRegTimeout.current = setTimeout(() => {
        // Register token with backend for targeted notifications
        registerFCMToken(user.id, fcmToken).then(success => {
          if (success) {
            console.log("FCM token registered with backend for targeted notifications");
          } else {
            fcmTokenRegistered.current = false; // Allow retry
          }
        }).catch(error => {
          console.error("Error registering FCM token:", error);
          fcmTokenRegistered.current = false; // Allow retry on next render
        });
      }, 1500);
    }
    
    // Reset registration flag when token changes or user logs out
    if (!fcmToken || !isAuthenticated) {
      fcmTokenRegistered.current = false;
      if (tokenRegTimeout.current) {
        clearTimeout(tokenRegTimeout.current);
        tokenRegTimeout.current = null;
      }
    }
    
    return () => {
      if (tokenRegTimeout.current) {
        clearTimeout(tokenRegTimeout.current);
        tokenRegTimeout.current = null;
      }
    };
  }, [isAuthenticated, user?.id, fcmToken]);

  // Navigate to notifications view
  const handleViewAllClick = () => {
    setIsOpen(false);
    if (userRole === "pharmacist" || isPharmacist) {
      navigate("/dashboard?view=pharmacy&section=notifications");
      return;
    }
    if (userRole === "doctor") {
      navigate("/dashboard?section=notifications");
      return;
    }
    navigate("/notifications", {
      state: { preserveAuth: true, keepSidebar: true },
    });
  };

  // Debug logging
  useEffect(() => {
    console.log('NotificationBell state:', {
      isAuthenticated,
      userId: user?.id,
      unreadCount,
      notificationsLength: notifications.length,
      isLoading
    });
  }, [isAuthenticated, user?.id, unreadCount, notifications.length, isLoading]);

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
