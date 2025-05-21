
import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationTabs from "./notifications/NotificationTabs";
import { useNavigate } from "react-router-dom";
import { useFirebaseNotifications } from "@/hooks/useFirebaseNotifications";

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    setupRealtimeSubscription,
    fetchError
  } = useNotifications();
  
  // Use Firebase notifications
  useFirebaseNotifications();
  
  // Use ref to track initialization
  const hasInitialized = useRef(false);
  const errorCountRef = useRef(0);
  const maxRetries = useRef(3);

  // Fetch notifications when authenticated - only once
  useEffect(() => {
    if (isAuthenticated && !hasInitialized.current) {
      console.log("NotificationBell: Initial data fetch");
      
      const fetchData = async () => {
        try {
          await fetchNotifications();
          errorCountRef.current = 0; // Reset error count on success
        } catch (err) {
          console.error("NotificationBell: Error fetching initial data", err);
          if (errorCountRef.current < maxRetries.current) {
            errorCountRef.current++;
            // Retry with exponential backoff
            const delay = 1000 * Math.pow(2, errorCountRef.current);
            console.log(`Retrying in ${delay}ms (attempt ${errorCountRef.current} of ${maxRetries.current})`);
            setTimeout(fetchData, delay);
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

  // Navigate to notifications view
  const handleViewAllClick = () => {
    setIsOpen(false);
    navigate("/notifications", { 
      state: { preserveAuth: true, keepSidebar: true }
    });
  };

  // If there was an error fetching notifications and we've exceeded max retries,
  // still render the bell but show an error state in the popover
  const hasEncounteredError = fetchError && errorCountRef.current >= maxRetries.current;

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
          hasError={hasEncounteredError}
          onMarkRead={markAsRead}
          onMarkAllRead={markAllAsRead}
          onViewAll={handleViewAllClick}
          onRetry={() => {
            errorCountRef.current = 0;
            hasInitialized.current = false;
            fetchNotifications();
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
