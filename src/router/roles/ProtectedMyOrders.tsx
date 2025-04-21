
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import MyOrders from '@/pages/MyOrders';

const ProtectedMyOrders = () => (
  <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist']}>
    <MyOrders />
  </ProtectedRoute>
);

export default ProtectedMyOrders;
