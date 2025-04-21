
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import DoctorDashboard from '@/pages/DoctorDashboard';

const ProtectedDoctorDashboard = () => (
  <ProtectedRoute allowedRoles={['doctor', 'superadmin']}>
    <DoctorDashboard />
  </ProtectedRoute>
);

export default ProtectedDoctorDashboard;
