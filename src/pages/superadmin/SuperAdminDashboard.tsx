
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import SuperAdminSidebar from "@/components/sidebar/SuperAdminSidebar";
import { useAuth } from "@/hooks/auth/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCards } from "@/components/admin/DashboardCards";
import { useDashboardStats } from "@/hooks/admin/useDashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PasswordChange from "@/components/settings/PasswordChange";
import AccountDeletion from "@/components/settings/AccountDeletion";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, isLoading, isAuthenticated } = useAuth();
  const { data, isLoading: statsLoading } = useDashboardStats();

  // Check which page we're on within the superadmin section
  const isSettingsPage = location.pathname === '/superadmin/settings';
  const isProfilePage = location.pathname === '/superadmin/profile';
  const isNotificationsPage = location.pathname === '/superadmin/notifications';
  const isBillingPage = location.pathname === '/superadmin/billing';
  const isUpgradePage = location.pathname === '/superadmin/upgrade';

  // Redirect non-superadmin users
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || profile?.role !== 'superadmin')) {
      console.log("Not authorized as superadmin, redirecting to login");
      navigate('/login');
    }
  }, [isAuthenticated, profile, isLoading, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full">
        <div className="w-64 bg-gray-100">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-12 w-1/3 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated or not a superadmin, don't render anything
  if (!isAuthenticated || profile?.role !== 'superadmin') {
    return null; // Will be redirected by useEffect
  }

  // Function to handle dashboard card clicks but only within the admin settings section
  const handleAdminTabChange = (value: string) => {
    navigate(`/admin-settings?tab=${value}`);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <SuperAdminSidebar />
      
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          {/* Show appropriate content based on the current route */}
          {isSettingsPage ? (
            <>
              <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-left">Password Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <PasswordChange />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-left">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AccountDeletion />
                  </CardContent>
                </Card>
              </div>
            </>
          ) : isProfilePage ? (
            <>
              <h1 className="text-3xl font-bold mb-6">SuperAdmin Profile</h1>
              <p>Welcome to your profile, {profile?.full_name || 'SuperAdmin'}!</p>
              <p className="mt-4">Email: {profile?.email || 'No email found'}</p>
              <p className="mt-2">Role: {profile?.role || 'superadmin'}</p>
            </>
          ) : isNotificationsPage ? (
            <>
              <h1 className="text-3xl font-bold mb-6">Notifications</h1>
              <p>Your notification settings and history will appear here.</p>
            </>
          ) : isBillingPage ? (
            <>
              <h1 className="text-3xl font-bold mb-6">Billing</h1>
              <p>Your billing information and subscription details will appear here.</p>
            </>
          ) : isUpgradePage ? (
            <>
              <h1 className="text-3xl font-bold mb-6">Upgrade Plan</h1>
              <p>Available upgrade options and plan details will appear here.</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-6">SuperAdmin Dashboard</h1>
              <DashboardCards onCardClick={handleAdminTabChange} />
            </>
          )}
        </main>
      </div>
      <Toaster />
    </div>
  );
};

export default SuperAdminDashboard;
