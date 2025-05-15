import { formatDistanceToNow } from "date-fns";
import { 
  Pill, 
  ShoppingCart, 
  Calendar, 
  UserPlus, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Package, 
  Settings, 
  CreditCard, 
  FileText,
  Clock,
  Award,
  Bell,
  Phone,
  Users,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Activity as BaseActivity } from "@/hooks/activity/types";

export type ActivityType = 
  | "prescription_created" 
  | "prescription_updated" 
  | "order_placed" 
  | "order_shipped" 
  | "order_delivered" 
  | "appointment_scheduled" 
  | "doctor_connected" 
  | "profile_updated" 
  | "payment_processed" 
  | "system_alert"
  | "payment_failed"
  | "teleconsultation_scheduled"
  | "delivery_status_updated"
  | "patient_connected"
  | "new_teleconsultation"
  | string; // Allow any string to support future activity types

// Extend the base Activity with the specific requirements for the ActivityItem component
export interface Activity extends BaseActivity {
  read: boolean;
  timestamp: Date;
}

interface ActivityItemProps {
  activity: Activity;
  onMarkRead: (id: string) => void;
}

export const ActivityItem = ({ activity, onMarkRead }: ActivityItemProps) => {
  const timeAgo = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });
  
  // Determine icon and color based on activity type
  const getActivityStyles = (type: ActivityType) => {
    switch (type) {
      case "prescription_created":
      case "prescription_updated":
        return { 
          icon: <Pill className="h-4 w-4" />, 
          color: "bg-purple-100 text-purple-800 border-purple-200" 
        };
      case "order_placed":
        return { 
          icon: <ShoppingCart className="h-4 w-4" />, 
          color: "bg-blue-100 text-blue-800 border-blue-200" 
        };
      case "order_shipped":
      case "order_delivered":
      case "delivery_status_updated":
        return { 
          icon: <Package className="h-4 w-4" />, 
          color: "bg-green-100 text-green-800 border-green-200" 
        };
      case "appointment_scheduled":
      case "teleconsultation_scheduled":
      case "new_teleconsultation":
        return { 
          icon: <Calendar className="h-4 w-4" />, 
          color: "bg-indigo-100 text-indigo-800 border-indigo-200" 
        };
      case "doctor_connected":
      case "patient_connected":
        return { 
          icon: <UserPlus className="h-4 w-4" />, 
          color: "bg-teal-100 text-teal-800 border-teal-200" 
        };
      case "profile_updated":
        return { 
          icon: <Settings className="h-4 w-4" />, 
          color: "bg-gray-100 text-gray-800 border-gray-200" 
        };
      case "payment_processed":
        return { 
          icon: <CreditCard className="h-4 w-4" />, 
          color: "bg-emerald-100 text-emerald-800 border-emerald-200" 
        };
      case "payment_failed":
        return { 
          icon: <AlertCircle className="h-4 w-4" />, 
          color: "bg-red-100 text-red-800 border-red-200" 
        };
      case "system_alert":
        return { 
          icon: <Bell className="h-4 w-4" />, 
          color: "bg-amber-100 text-amber-800 border-amber-200" 
        };
      default:
        // Check for common patterns in the type string to guess the appropriate icon
        if (type.includes('order') || type.includes('purchase')) {
          return { 
            icon: <ShoppingCart className="h-4 w-4" />, 
            color: "bg-blue-100 text-blue-800 border-blue-200" 
          };
        } else if (type.includes('prescription') || type.includes('medication')) {
          return { 
            icon: <Pill className="h-4 w-4" />, 
            color: "bg-purple-100 text-purple-800 border-purple-200" 
          };
        } else if (type.includes('appointment') || type.includes('consultation') || type.includes('teleconsultation')) {
          return { 
            icon: <Calendar className="h-4 w-4" />, 
            color: "bg-indigo-100 text-indigo-800 border-indigo-200" 
          };
        } else if (type.includes('patient') || type.includes('doctor') || type.includes('connected')) {
          return { 
            icon: <UserPlus className="h-4 w-4" />, 
            color: "bg-teal-100 text-teal-800 border-teal-200" 
          };
        } else if (type.includes('payment') || type.includes('billing')) {
          return { 
            icon: <CreditCard className="h-4 w-4" />, 
            color: "bg-emerald-100 text-emerald-800 border-emerald-200" 
          };
        } else if (type.includes('delivery') || type.includes('shipped')) {
          return { 
            icon: <Package className="h-4 w-4" />, 
            color: "bg-green-100 text-green-800 border-green-200" 
          };
        } else if (type.includes('alert') || type.includes('warning') || type.includes('error')) {
          return { 
            icon: <AlertCircle className="h-4 w-4" />, 
            color: "bg-red-100 text-red-800 border-red-200" 
          };
        } else if (type.includes('profile') || type.includes('settings')) {
          return { 
            icon: <User className="h-4 w-4" />, 
            color: "bg-gray-100 text-gray-800 border-gray-200" 
          };
        }
        
        // Default fallback
        return { 
          icon: <RefreshCw className="h-4 w-4" />, 
          color: "bg-gray-100 text-gray-800 border-gray-200" 
        };
    }
  };

  const { icon, color } = getActivityStyles(activity.type as ActivityType);

  return (
    <div 
      className={cn(
        "p-3 border rounded-md mb-2 cursor-pointer flex relative hover:shadow-sm transition-all duration-200",
        activity.read ? "opacity-70 bg-gray-50" : color,
        "hover:opacity-90 transition-all"
      )}
      onClick={() => !activity.read && onMarkRead(activity.id)}
    >
      <div className="mr-3 mt-0.5">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-sm">{activity.title}</h4>
        <p className="text-xs mt-1 line-clamp-2">{activity.description}</p>
        <div className="text-xs text-muted-foreground mt-1">{timeAgo}</div>
      </div>
      {!activity.read && (
        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary"></div>
      )}
    </div>
  );
};
