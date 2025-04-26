
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import Dashboard from '@/pages/Dashboard';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useNavigate } from 'react-router-dom';
import { getDashboardRouteByRole } from '@/utils/auth/getDashboardRouteByRole';

const ProtectedDashboard = () => {
  const { userRole, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to role-specific dashboard if authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && userRole) {
      const dashboardRoute = getDashboardRouteByRole(userRole);
      if (dashboardRoute !== '/dashboard') {
        navigate(dashboardRoute, { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, userRole, navigate]);
  
  // Handle initial loading state when auth is being determined
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  // If not authenticated, ProtectedRoute will handle redirection
  return (
    <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
      <Dashboard />
    </ProtectedRoute>
  );
};

export default ProtectedDashboard;
