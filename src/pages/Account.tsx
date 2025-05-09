
import React from "react";
import AccountPage from "@/components/loyalty/AccountPage";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import RequireRoleGuard from "@/components/auth/RequireRoleGuard";
import { useAuth } from "@/hooks/auth/useAuth";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import DoctorLayout from "@/components/layout/DoctorLayout";

const Account = () => {
  const { userRole } = useAuth();

  // Wrap content with the appropriate layout based on user role
  const content = (
    <RequireRoleGuard allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
      <div className="container mx-auto px-4 py-4 md:py-8">
        <AccountPage />
      </div>
    </RequireRoleGuard>
  );

  // Use the appropriate layout based on user role
  if (userRole === 'pharmacist') {
    return <PharmacistLayout>{content}</PharmacistLayout>;
  } else if (userRole === 'doctor') {
    return <DoctorLayout>{content}</DoctorLayout>;
  } else {
    // Default to UnifiedLayoutTemplate for patients/regular users
    return <UnifiedLayoutTemplate>{content}</UnifiedLayoutTemplate>;
  }
};

export default Account;
