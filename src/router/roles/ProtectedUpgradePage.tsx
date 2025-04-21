
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import UpgradePage from '@/pages/upgrade/UpgradePage';

const ProtectedUpgradePage = () => (
  <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist']}>
    <UpgradePage />
  </ProtectedRoute>
);

export default ProtectedUpgradePage;
