
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/lib/supabase";
import NotificationTabs from "./notifications/NotificationTabs";
import { Notification } from "./notifications/NotificationItem";
import { toast } from "@/components/ui/use-toast";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, profile } = useAuth();

  // Calculate unread count
  useEffect(() => {
    if (notifications.length > 0) {
      const count = notifications.filter(n => !n.read).length;
      setUnreadCount(count);
    } else {
      setUnreadCount(0);
    }
  }, [notifications]);

  // Fetch notifications
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    const fetchNotifications = async () => {
      try {
        // In a real application, this would fetch from a notifications table
        // For now, we'll use mock data based on user role
        const role = profile?.role || 'patient';
        
        // For demo purposes, generate mock notifications based on role
        // In production, this would be a database call
        let mockNotifications: Notification[] = [];
        
        if (role === 'doctor') {
          mockNotifications = [
            {
              id: "1",
              type: "patient_connected",
              title: "New Patient Connection",
              message: "Patient John Doe has connected with you",
              read: false,
              createdAt: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: "2",
              type: "prescription_created",
              title: "Prescription Sent",
              message: "Prescription #PR-2023-001 for patient Jane Smith has been sent",
              read: true,
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            }
          ];
        } else if (role === 'pharmacist') {
          mockNotifications = [
            {
              id: "1",
              type: "prescription_created",
              title: "New Prescription",
              message: "Dr. Smith has sent a new prescription for patient Jane Doe",
              read: false,
              createdAt: new Date(Date.now() - 1800000).toISOString(),
            },
            {
              id: "2",
              type: "payment_successful",
              title: "Payment Successful",
              message: "Payment for order #ORD-2023-001 has been completed",
              read: false,
              createdAt: new Date(Date.now() - 7200000).toISOString(),
            }
          ];
        } else if (role === 'superadmin') {
          mockNotifications = [
            {
              id: "1",
              type: "new_user_registered",
              title: "New User Registration",
              message: "John Doe has registered as a new patient",
              read: false,
              createdAt: new Date(Date.now() - 900000).toISOString(),
            },
            {
              id: "2",
              type: "new_doctor",
              title: "New Doctor Enrolled",
              message: "Dr. Emily Johnson has enrolled as a doctor",
              read: false,
              createdAt: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: "3",
              type: "new_pharmacy",
              title: "New Pharmacy Enrolled",
              message: "MediCare Pharmacy has been registered",
              read: true,
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            }
          ];
        } else { // Default patient notifications
          mockNotifications = [
            {
              id: "1",
              type: "payment_successful",
              title: "Payment Successful",
              message: "Your payment for order #ORD-2023-001 has been processed",
              read: false,
              createdAt: new Date(Date.now() - 1800000).toISOString(),
            },
            {
              id: "2",
              type: "delivery_incoming",
              title: "Delivery On The Way",
              message: "Your order #ORD-2023-001 is out for delivery",
              read: false,
              createdAt: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: "3",
              type: "prescription_created",
              title: "New Prescription",
              message: "Dr. Smith has created a new prescription for you",
              read: true,
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            }
          ];
        }
        
        setNotifications(mockNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    
    fetchNotifications();
    
    // In a real app, you would set up a real-time subscription here
    // to listen for new notifications
    
  }, [isAuthenticated, user, profile]);

  const handleMarkRead = (id: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    
    // In a real app, this would update the database as well
    // For demo purposes, just show a toast
    toast({
      title: "Notification marked as read",
      description: "The notification has been marked as read",
    });
  };

  const handleMarkAllRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
    
    // In a real app, this would update the database as well
    toast({
      title: "All notifications marked as read",
      description: "All notifications have been marked as read",
    });
  };

  if (!isAuthenticated) {
    return null;
  }

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
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
        />
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
