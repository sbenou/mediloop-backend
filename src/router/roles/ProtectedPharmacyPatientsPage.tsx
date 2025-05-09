
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import PatientsPage from '@/pages/pharmacy/PatientsPage';

const ProtectedPharmacyPatientsPage = () => {
  return (
    <ProtectedRoute allowedRoles={['pharmacist']}>
      <PatientsPage />
    </ProtectedRoute>
  );
};

export default ProtectedPharmacyPatientsPage;
