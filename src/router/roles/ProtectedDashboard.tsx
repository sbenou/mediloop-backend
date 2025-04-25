
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import Dashboard from '@/pages/Dashboard';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';

const ProtectedDashboard = () => {
  const { userRole, isPharmacist, isLoading, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasAttemptedRedirect, setHasAttemptedRedirect] = useState(false);
  
  // Check if this is a navigation with preserved auth state
  const isPreservedAuthNav = location.state && location.state.preserveAuth === true;
  
  // Handle pharmacist redirections with proper params
  useEffect(() => {
    if (!isLoading && !hasAttemptedRedirect) {
      setHasAttemptedRedirect(true);
      
      if (!isAuthenticated) {
        console.log('User not authenticated, navigating to login');
        navigate('/login', { replace: true });
        return;
      }
      
      // For pharmacists, ensure the correct view parameters
      if (isPharmacist || userRole === 'pharmacist') {
        const currentView = searchParams.get('view');
        const currentSection = searchParams.get('section');
        
        if (currentView !== 'pharmacy' || !currentSection) {
          console.log('Setting default pharmacist params for dashboard');
          setSearchParams({ view: 'pharmacy', section: 'dashboard' }, { replace: true });
        }
      }
    }
  }, [userRole, isPharmacist, isLoading, isAuthenticated, navigate, hasAttemptedRedirect, searchParams, setSearchParams]);
  
  // If we're still in the loading state, show a short-circuit loading indicator
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
  
  return (
    <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
      <Dashboard />
    </ProtectedRoute>
  );
};

export default ProtectedDashboard;
