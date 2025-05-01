
import React from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useLocation, useSearchParams } from 'react-router-dom';
import { 
  ProfileView, 
  OrdersView, 
  PrescriptionsView,
  PharmacyView 
} from "@/components/dashboard/views";
import PharmacistSidebar from '@/components/sidebar/PharmacistSidebar';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex flex-1">
        <div className="hidden md:block">
          <PharmacistSidebar />
        </div>
        
        <div className="flex-1 flex flex-col">
          <UnifiedHeader />
          
          <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl h-full">
            <ScrollArea className="h-full w-full hover-scroll main-content-scroll">
              {getContent()}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyDashboard;
