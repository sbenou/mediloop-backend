
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import Settings from '@/pages/Settings';

const ProtectedSettings = () => (
  <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
    <Settings />
  </ProtectedRoute>
);

export default ProtectedSettings;
