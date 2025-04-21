
import RequireRoleGuard from '@/components/auth/RequireRoleGuard';
import ManageBoostsPage from '@/pages/ManageBoostsPage';

const ProtectedManageBoostsPage = () => (
  <RequireRoleGuard allowedRoles={['doctor', 'pharmacist']}>
    <ManageBoostsPage />
  </RequireRoleGuard>
);

export default ProtectedManageBoostsPage;
