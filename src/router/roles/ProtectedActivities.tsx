
import ProtectedRoute from '@/components/routing/ProtectedRoute';
import Activities from '@/pages/Activities';

interface Props {
  initialView: "notifications" | "activities";
}

const ProtectedActivities = ({ initialView }: Props) => (
  <ProtectedRoute allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
    <Activities initialView={initialView} />
  </ProtectedRoute>
);

export default ProtectedActivities;
