
import React from "react";
import { useAuth } from "@/hooks/auth/useAuth";

interface SubscriptionTabGuardProps {
  children: React.ReactNode;
}

const SubscriptionTabGuard: React.FC<SubscriptionTabGuardProps> = ({ children }) => {
  const { userRole } = useAuth();
  
  // These roles can access the subscription tab
  const allowedRoles = ['superadmin', 'patient', 'pharmacist', 'doctor'];
  
  if (!userRole || !allowedRoles.includes(userRole)) {
    return null;
  }
  
  return <>{children}</>;
};

export default SubscriptionTabGuard;
