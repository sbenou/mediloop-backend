
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Notification } from "@/types/supabase";

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case "payment_failed":
      return "bg-red-100 text-red-800 border-red-200";
    case "payment_successful":
      return "bg-green-100 text-green-800 border-green-200";
    case "delivery_incoming":
    case "delivery_successful":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "delivery_late":
    case "delivery_failed":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "prescription_created":
    case "prescription_updated":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "patient_connected":
    case "new_user_registered":
    case "new_subscription":
    case "new_teleconsultation":
    case "new_doctor":
    case "new_pharmacy":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const NotificationItem = ({ notification, onMarkRead }: NotificationItemProps) => {
  const notificationColor = getNotificationColor(notification.type);
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });
  
  return (
    <div 
      className={`p-3 border rounded-md mb-2 cursor-pointer relative ${notification.read ? 'opacity-70' : notificationColor}`}
      onClick={() => !notification.read && onMarkRead(notification.id)}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-sm">{notification.title}</h4>
        {!notification.read && (
          <Badge variant="default" className="bg-primary text-white">New</Badge>
        )}
      </div>
      <p className="text-sm mt-1">{notification.message}</p>
      <div className="text-xs text-muted-foreground mt-2">{timeAgo}</div>
    </div>
  );
};

export default NotificationItem;
