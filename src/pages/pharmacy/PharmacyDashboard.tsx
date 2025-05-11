
import React from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useSearchParams } from 'react-router-dom';
import { 
  ProfileView, 
  OrdersView, 
  PrescriptionsView,
  PharmacyView,
  SettingsView 
} from "@/components/dashboard/views";
import PharmacistLayout from '@/components/layout/PharmacistLayout';
import { ScrollArea } from '@/components/ui/scroll-area';

const PharmacyDashboard = () => {
  const [searchParams] = useSearchParams();
  const { userRole } = useAuth();
  
  const section = searchParams.get("section") || "dashboard";
  const profileTab = searchParams.get("profileTab") || "personal";
  const ordersTab = searchParams.get("ordersTab") || "all";
  
  console.log("PharmacyDashboard rendering with section:", section);

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
      case "settings":
        return <SettingsView userRole={userRole} />;
      case "dashboard":
      default:
        return <PharmacyView userRole={userRole} section="dashboard" />;
    }
  };

  return (
    <PharmacistLayout>
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
        <ScrollArea className="h-full w-full hover-scroll main-content-scroll">
          {getContent()}
        </ScrollArea>
      </div>
    </PharmacistLayout>
  );
};

export default PharmacyDashboard;
