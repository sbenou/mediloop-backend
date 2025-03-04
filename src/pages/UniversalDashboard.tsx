
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  ProfileView,
  SettingsView,
  OrdersView,
  PrescriptionsView,
  TeleconsultationsView,
  HomeView,
} from "@/components/dashboard/views";

const UniversalDashboard = () => {
  const { userRole, isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const view = searchParams.get('view') || 'home';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please login to access this page.",
      });
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const hasPermissionForView = (view: string): boolean => {
    const commonViews = ['home', 'profile', 'settings'];
    
    if (commonViews.includes(view)) return true;
    
    switch (userRole) {
      case 'patient':
        return ['orders', 'prescriptions', 'teleconsultations'].includes(view);
      case 'doctor':
        return ['patients', 'appointments', 'prescriptions'].includes(view);
      case 'pharmacist':
        return ['inventory', 'orders', 'prescriptions'].includes(view);
      case 'superadmin':
        return true;
      default:
        return false;
    }
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasPermissionForView(view)) {
      toast({
        variant: "destructive",
        title: "Access restricted",
        description: "You don't have permission to access this view.",
      });
      navigate("/dashboard?view=home");
    }
  }, [view, userRole, isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <UnifiedLayoutTemplate>
        <div className="space-y-4">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </UnifiedLayoutTemplate>
    );
  }

  const renderView = () => {
    const commonProps = {
      ordersTab: searchParams.get('ordersTab') || 'orders',
      profileTab: searchParams.get('profileTab') || 'personal',
    };

    switch (view) {
      case 'profile':
        return <ProfileView activeTab={commonProps.profileTab} userRole={userRole} />;
      case 'settings':
        return <SettingsView userRole={userRole} />;
      case 'orders':
        return <OrdersView activeTab={commonProps.ordersTab} userRole={userRole} />;
      case 'prescriptions':
        return <PrescriptionsView userRole={userRole} />;
      case 'teleconsultations':
        return <TeleconsultationsView userRole={userRole} />;
      case 'home':
      default:
        return <HomeView userRole={userRole} />;
    }
  };

  return (
    <UnifiedLayoutTemplate>
      <div className="h-full overflow-hidden">
        <ScrollArea className="h-full w-full">
          {renderView()}
        </ScrollArea>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default UniversalDashboard;
