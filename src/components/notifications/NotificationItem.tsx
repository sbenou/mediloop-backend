
import React from "react";
import { Notification } from "@/types/domain";
import { Check, BellRing, AlertTriangle } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Notification variants based on type
const notificationVariants = cva(
  "relative flex items-start gap-4 rounded-lg border p-4 shadow-sm transition-all",
  {
    variants: {
      variant: {
        default: "bg-card",
        alert: "bg-amber-50 border-amber-200",
        error: "bg-rose-50 border-rose-200",
        success: "bg-green-50 border-green-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// Determine if notification is an alert based on type
const isAlertNotification = (type: string): boolean => {
  const alertTypes = ["payment_failed", "delivery_late", "delivery_failed"];
  return alertTypes.includes(type);
};

// Get appropriate variant based on notification type
const getVariantFromType = (type: string): "default" | "alert" | "error" | "success" => {
  if (type === "payment_failed") return "error";
  if (["delivery_late", "delivery_failed"].includes(type)) return "alert";
  if (type.includes("success") || type.includes("completed")) return "success";
  return "default";
};

// Format notification type for display
const formatNotificationType = (type: string): string => {
  return type
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

const NotificationItem = ({ notification, onMarkRead }: NotificationItemProps) => {
  const variant = getVariantFromType(notification.type);
  const isAlert = isAlertNotification(notification.type);
  
  return (
    <div
      className={cn(
        notificationVariants({ variant }),
        notification.read ? "opacity-70" : "",
        "mb-2 relative"
      )}
      onClick={() => !notification.read && onMarkRead(notification.id)}
    >
      {!notification.read && (
        <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
      )}
      <div className="flex-shrink-0">
        {isAlert ? (
          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <BellRing className="h-4 w-4 text-blue-600" />
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">{notification.title}</h4>
          <time className="text-xs text-muted-foreground">
            {format(new Date(notification.created_at), "MMM d, h:mm a")}
          </time>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs bg-secondary px-2 py-0.5 rounded">
            {formatNotificationType(notification.type)}
          </span>
          {notification.read ? (
            <span className="text-xs text-muted-foreground flex items-center">
              <Check className="h-3 w-3 mr-1" />
              Read
            </span>
          ) : (
            <button
              className="text-xs text-primary hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
