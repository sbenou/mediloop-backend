
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import Dashboard from '@/pages/Dashboard';

const ProtectedDashboard = () => (
  <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
    <Dashboard />
  </ProtectedRoute>
);

export default ProtectedDashboard;
