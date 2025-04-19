
import React from "react";
import AccountPage from "@/components/loyalty/AccountPage";
import PatientLayout from "@/components/layout/PatientLayout";
import RequireRoleGuard from "@/components/auth/RequireRoleGuard";

const Account = () => {
  return (
    <PatientLayout>
      <RequireRoleGuard allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
        <AccountPage />
      </RequireRoleGuard>
    </PatientLayout>
  );
};

export default Account;
