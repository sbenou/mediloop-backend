
import RequireRoleGuard from '@/components/auth/RequireRoleGuard';
import Account from '@/pages/Account';

const ProtectedAccountPage = () => (
  <RequireRoleGuard allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
    <Account />
  </RequireRoleGuard>
);

export default ProtectedAccountPage;
