
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import { toast } from "@/components/ui/use-toast";
import ProfileView from "@/components/dashboard/views/ProfileView";
import SettingsView from "@/components/dashboard/views/SettingsView";
import OrdersView from "@/components/dashboard/views/OrdersView";
import PrescriptionsView from "@/components/dashboard/views/PrescriptionsView";
import TeleconsultationsView from "@/components/dashboard/views/TeleconsultationsView";
import HomeView from "@/components/dashboard/views/HomeView";
import { Skeleton } from "@/components/ui/skeleton";

const UniversalDashboard = () => {
  const { userRole, isAuthenticated, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const view = searchParams.get('view') || 'home';

  // Redirects user to login if not authenticated
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

  // Role-specific permission checks - can be expanded for new roles
  const hasPermissionForView = (view: string): boolean => {
    // Common views accessible by all roles
    const commonViews = ['home', 'profile', 'settings'];
    
    if (commonViews.includes(view)) return true;
    
    // Role-specific view permissions
    switch (userRole) {
      case 'patient':
        return ['orders', 'prescriptions', 'teleconsultations'].includes(view);
      case 'doctor':
        return ['patients', 'appointments', 'prescriptions'].includes(view);
      case 'pharmacist':
        return ['inventory', 'orders', 'prescriptions'].includes(view);
      case 'superadmin':
        // Superadmin can access everything
        return true;
      default:
        return false;
    }
  };

  // If view is not allowed for current role, redirect to home
  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasPermissionForView(view)) {
      toast({
        variant: "destructive",  // Changed from "warning" to "destructive"
        title: "Access restricted",
        description: "You don't have permission to access this view.",
      });
      navigate("/dashboard?view=home");
    }
  }, [view, userRole, isAuthenticated, isLoading, navigate]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <UnifiedLayout>
        <div className="space-y-4">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </UnifiedLayout>
    );
  }

  // Render the appropriate view based on the URL parameter
  const renderView = () => {
    // Common parameters from URL that might be needed by multiple views
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
    <UnifiedLayout>
      {renderView()}
    </UnifiedLayout>
  );
};

export default UniversalDashboard;
