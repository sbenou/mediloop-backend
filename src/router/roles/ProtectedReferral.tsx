
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import Referral from '@/pages/Referral';

const ProtectedReferral = () => (
  <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist']}>
    <Referral />
  </ProtectedRoute>
);

export default ProtectedReferral;
