
import Dashboard from '@/pages/Dashboard';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/auth/useAuth';

const ProtectedDashboard = () => {
  const { isLoading, isAuthenticated, profile } = useAuth();
  
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
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Dashboard access is role-driven from DB (public.roles.has_dashboard),
  // avoiding hardcoded role lists in frontend guards.
  if (!profile?.has_dashboard) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Dashboard />;
};

export default ProtectedDashboard;
