
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import PharmacyDashboard from '@/pages/pharmacy/PharmacyDashboard';

const ProtectedPharmacyDashboard = () => {
  return (
    <ProtectedRoute allowedRoles={['pharmacist']}>
      <PharmacyDashboard />
    </ProtectedRoute>
  );
};

export default ProtectedPharmacyDashboard;
