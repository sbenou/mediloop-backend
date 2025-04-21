
import React from "react";
import AccountPage from "@/components/loyalty/AccountPage";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import RequireRoleGuard from "@/components/auth/RequireRoleGuard";

const Account = () => {
  return (
    <UnifiedLayoutTemplate>
      <RequireRoleGuard allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
        <AccountPage />
      </RequireRoleGuard>
    </UnifiedLayoutTemplate>
  );
};

export default Account;
