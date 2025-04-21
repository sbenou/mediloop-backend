
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import MyPrescriptions from '@/pages/MyPrescriptions';

const ProtectedMyPrescriptions = () => (
  <ProtectedRoute allowedRoles={['patient', 'doctor']}>
    <MyPrescriptions />
  </ProtectedRoute>
);

export default ProtectedMyPrescriptions;
