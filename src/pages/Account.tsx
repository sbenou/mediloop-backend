
import React from "react";
import AccountPage from "@/components/loyalty/AccountPage";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import RequireRoleGuard from "@/components/auth/RequireRoleGuard";
import { useAuth } from "@/hooks/auth/useAuth";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import DoctorLayout from "@/components/layout/DoctorLayout";
import { Loader } from "lucide-react";

const Account = () => {
  const { userRole, isLoading, isPharmacist } = useAuth();

  // Wrap content with the appropriate layout based on user role
  const content = (
    <RequireRoleGuard allowedRoles={['patient', 'doctor', 'pharmacist', 'superadmin']}>
      <div className="container mx-auto px-4 py-4 md:py-8">
        <AccountPage />
      </div>
    </RequireRoleGuard>
  );

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-2 bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading account…</p>
      </div>
    );
  }

  const isPharmacyUser = userRole === "pharmacist" || isPharmacist;

  if (isPharmacyUser) {
    return <PharmacistLayout>{content}</PharmacistLayout>;
  }
  if (userRole === "doctor") {
    return <DoctorLayout>{content}</DoctorLayout>;
  }
  return <UnifiedLayoutTemplate>{content}</UnifiedLayoutTemplate>;
};

export default Account;
