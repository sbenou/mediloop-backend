
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import DoctorDashboard from '@/pages/DoctorDashboard';
import { useAuth } from '@/hooks/auth/useAuth';

const ProtectedDoctorDashboard = () => {
  const { userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Only redirect if we're not loading and the user role is confirmed to be neither doctor nor superadmin
  useEffect(() => {
    if (!isLoading && userRole && userRole !== 'doctor' && userRole !== 'superadmin') {
      navigate('/dashboard', { replace: true });
    }
  }, [userRole, isLoading, navigate]);
  
  return (
    <ProtectedRoute allowedRoles={['doctor', 'superadmin']}>
      <DoctorDashboard />
    </ProtectedRoute>
  );
};

export default ProtectedDoctorDashboard;
