
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import UniversalDashboard from '@/pages/UniversalDashboard';

const ProtectedUniversalDashboard = () => (
  <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
    <UniversalDashboard />
  </ProtectedRoute>
);

export default ProtectedUniversalDashboard;
