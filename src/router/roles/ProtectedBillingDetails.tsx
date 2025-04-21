
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import BillingDetails from '@/pages/BillingDetails';

const ProtectedBillingDetails = () => (
  <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist']}>
    <BillingDetails />
  </ProtectedRoute>
);

export default ProtectedBillingDetails;
