
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import Dashboard from '@/pages/Dashboard';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useSearchParams } from 'react-router-dom';

const ProtectedDashboard = () => {
  const { userRole, isPharmacist } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Make sure pharmacy users always have the correct params
  useEffect(() => {
    if (isPharmacist || userRole === 'pharmacist') {
      const currentView = searchParams.get('view');
      const currentSection = searchParams.get('section');
      
      if (currentView !== 'pharmacy' || !currentSection) {
        console.log('Setting default pharmacist params for dashboard');
        setSearchParams({ view: 'pharmacy', section: 'dashboard' });
      }
    }
  }, [userRole, isPharmacist, searchParams, setSearchParams]);
  
  return (
    <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
      <Dashboard />
    </ProtectedRoute>
  );
};

export default ProtectedDashboard;
