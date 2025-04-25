
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import Dashboard from '@/pages/Dashboard';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useSearchParams, useNavigate } from 'react-router-dom';

const ProtectedDashboard = () => {
  const { userRole, isPharmacist, isLoading, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [hasAttemptedRedirect, setHasAttemptedRedirect] = useState(false);
  
  // Force immediate redirection for pharmacists to avoid loading issues
  useEffect(() => {
    if (!isLoading && !hasAttemptedRedirect) {
      setHasAttemptedRedirect(true);
      
      if (!isAuthenticated) {
        console.log('User not authenticated, navigating to login');
        navigate('/login', { replace: true });
        return;
      }
      
      if (isPharmacist || userRole === 'pharmacist') {
        console.log('Setting default pharmacist params for dashboard - direct navigation');
        window.location.href = '/dashboard?view=pharmacy&section=dashboard';
        return;
      }
    }
  }, [userRole, isPharmacist, isLoading, isAuthenticated, navigate, hasAttemptedRedirect]);
  
  // Make sure pharmacy users always have the correct params
  useEffect(() => {
    if (!isLoading && !hasAttemptedRedirect && (isPharmacist || userRole === 'pharmacist')) {
      const currentView = searchParams.get('view');
      const currentSection = searchParams.get('section');
      
      if (currentView !== 'pharmacy' || !currentSection) {
        console.log('Setting default pharmacist params for dashboard');
        setSearchParams({ view: 'pharmacy', section: 'dashboard' });
      }
    }
  }, [userRole, isPharmacist, searchParams, setSearchParams, isLoading, hasAttemptedRedirect]);
  
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
