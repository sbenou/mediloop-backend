
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperAdminSidebar from "@/components/sidebar/SuperAdminSidebar";
import { useAuth } from "@/hooks/auth/useAuth";
import { DashboardCards } from "@/components/admin/DashboardCards";

const SuperAdminDashboard = () => {
  const { profile, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!isLoading && isAuthenticated && profile?.role !== 'superadmin') {
      // Redirect to appropriate dashboard based on role
      if (profile?.role === 'pharmacist') {
        navigate('/pharmacy/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, profile, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || profile?.role !== 'superadmin') {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SuperAdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="container p-6 mx-auto">
          <h1 className="text-2xl font-bold mb-6">Superadmin Dashboard</h1>
          <DashboardCards />
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
