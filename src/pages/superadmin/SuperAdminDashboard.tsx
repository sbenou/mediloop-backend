
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

  // Check if we're on a settings page
  const isSettingsPage = location.pathname === '/superadmin/settings';
  
  // Check if we're on a profile page
  const isProfilePage = location.pathname === '/superadmin/profile';

  // Redirect non-superadmin users
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || profile?.role !== 'superadmin')) {
      navigate('/login');
    }
  }, [isAuthenticated, profile, isLoading, navigate]);

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

  if (!isAuthenticated || profile?.role !== 'superadmin') {
    return null; // Will be redirected by useEffect
  }

  const handleTabChange = (value: string) => {
    if (value === 'settings') {
      navigate('/admin-settings');
    } else {
      navigate(`/admin-settings?tab=${value}`);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <SuperAdminSidebar />
      
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          {/* Show appropriate content based on the route */}
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
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-6">SuperAdmin Dashboard</h1>
              <DashboardCards onCardClick={handleTabChange} />
            </>
          )}
        </main>
      </div>
      <Toaster />
    </div>
  );
};

export default SuperAdminDashboard;
