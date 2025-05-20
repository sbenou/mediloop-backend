
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import DoctorDashboard from '@/pages/DoctorDashboard';
import { useAuth } from '@/hooks/auth/useAuth';

const ProtectedDoctorDashboard = () => {
  const { userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // If the user is not a doctor, they should be redirected to the regular dashboard
  useEffect(() => {
    if (!isLoading && userRole && userRole !== 'doctor' && userRole !== 'superadmin') {
      navigate('/dashboard', { replace: true });
    }
  }, [userRole, isLoading, navigate]);
  
  // For doctors, show the doctor dashboard with the ProtectedRoute wrapper
  return (
    <ProtectedRoute allowedRoles={['doctor', 'superadmin']}>
      <DoctorDashboard />
    </ProtectedRoute>
  );
};

export default ProtectedDoctorDashboard;
