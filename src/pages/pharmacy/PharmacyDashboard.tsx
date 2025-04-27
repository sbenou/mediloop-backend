
import React from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import PharmacistLayout from '@/components/layout/PharmacistLayout';
import { useLocation, useSearchParams } from 'react-router-dom';
import { 
  ProfileView, 
  OrdersView, 
  PrescriptionsView,
  PharmacyView 
} from "@/components/dashboard/views";

const PharmacyDashboard = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { userRole, isLoading } = useAuth();
  
  const section = searchParams.get("section") || "dashboard";
  const profileTab = searchParams.get("profileTab") || "personal";
  const ordersTab = searchParams.get("ordersTab") || "orders";
  
  console.log("PharmacyDashboard render:", { 
    userRole, 
    section,
    profileTab,
    ordersTab,
    location: location.pathname + location.search
  });

  const getContent = () => {
    switch (section) {
      case "profile":
        return <ProfileView activeTab={profileTab} userRole={userRole} />;
      case "orders":
        return <OrdersView activeTab={ordersTab} userRole={userRole} />;
      case "prescriptions":
        return <PrescriptionsView userRole={userRole} />;
      case "patients":
        return <PharmacyView userRole={userRole} section="patients" />;
      case "dashboard":
      default:
        return <PharmacyView userRole={userRole} section={section} />;
    }
  };

  return (
    <PharmacistLayout>
      {getContent()}
    </PharmacistLayout>
  );
};

export default PharmacyDashboard;
