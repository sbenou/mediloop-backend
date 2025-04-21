
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import DoctorProfilePage from '@/pages/doctor/DoctorProfilePage';

const ProtectedDoctorProfilePage = () => (
  <ProtectedRoute allowedRoles={['doctor', 'superadmin']}>
    <DoctorProfilePage />
  </ProtectedRoute>
);

export default ProtectedDoctorProfilePage;
