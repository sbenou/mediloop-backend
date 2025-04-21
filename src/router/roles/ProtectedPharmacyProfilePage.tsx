
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import PharmacyProfilePage from '@/pages/pharmacy/PharmacyProfile';

const ProtectedPharmacyProfilePage = () => (
  <ProtectedRoute allowedRoles={['pharmacist', 'superadmin']}>
    <PharmacyProfilePage />
  </ProtectedRoute>
);

export default ProtectedPharmacyProfilePage;
