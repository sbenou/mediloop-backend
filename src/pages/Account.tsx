
import React from "react";
import AccountPage from "@/components/loyalty/AccountPage";
import PatientLayout from "@/components/layout/PatientLayout";
import RequireRoleGuard from "@/components/auth/RequireRoleGuard";
import { useAuth } from "@/hooks/auth/useAuth";
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import DoctorLayout from "@/components/layout/DoctorLayout";

const Account = () => {
  const { userRole } = useAuth();

  // Choose the appropriate layout based on user role
  const RenderLayout = () => {
    if (userRole === 'doctor') {
      return (
        <DoctorLayout>
          <AccountPage />
        </DoctorLayout>
      );
    } else if (userRole === 'pharmacist') {
      return (
        <UnifiedLayout>
          <AccountPage />
        </UnifiedLayout>
      );
    } else {
      // Default to PatientLayout for patients and other roles
      return (
        <PatientLayout>
          <AccountPage />
        </PatientLayout>
      );
    }
  };

  return (
    <RequireRoleGuard allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
      <RenderLayout />
    </RequireRoleGuard>
  );
};

export default Account;
