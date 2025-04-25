
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
  
  // Handle redirection for pharmacists
  useEffect(() => {
    if (!isLoading && !hasAttemptedRedirect) {
      setHasAttemptedRedirect(true);
      
      if (!isAuthenticated) {
        console.log('User not authenticated, navigating to login');
        navigate('/login', { replace: true });
        return;
      }
      
      if (isPharmacist || userRole === 'pharmacist') {
        console.log('Setting default pharmacist params for dashboard - using navigate');
        // Check if we're coming from a pharmacy-specific navigation
        const fromPharmacy = location.state?.fromPharmacy;
        
        if (!fromPharmacy) {
          // Use navigate with replace to avoid history stacking
          navigate('/dashboard?view=pharmacy&section=dashboard', { 
            replace: true,
            state: { fromPharmacy: true } 
          });
        }
        return;
      }
    }
  }, [userRole, isPharmacist, isLoading, isAuthenticated, navigate, hasAttemptedRedirect, location.state]);
  
  // Make sure pharmacy users always have the correct params
  useEffect(() => {
    if (!isLoading && isAuthenticated && (isPharmacist || userRole === 'pharmacist')) {
      const currentView = searchParams.get('view');
      const currentSection = searchParams.get('section');
      
      if (currentView !== 'pharmacy' || !currentSection) {
        console.log('Setting default pharmacist params for dashboard');
        setSearchParams({ view: 'pharmacy', section: 'dashboard' });
      }
    }
  }, [userRole, isPharmacist, searchParams, setSearchParams, isLoading, isAuthenticated]);
  
  // If we're still in the loading state, show a short-circuit loading indicator
  if (isLoading && (isPharmacist || userRole === 'pharmacist')) {
    return <div>Loading pharmacy dashboard...</div>;
  }
  
  return (
    <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
      <Dashboard />
    </ProtectedRoute>
  );
};

export default ProtectedDashboard;
