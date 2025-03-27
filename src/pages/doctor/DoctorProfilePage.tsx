
import React from "react";
import UniversalProfessionalProfile from "@/components/profile/UniversalProfessionalProfile";
import DoctorLayout from "@/components/layout/DoctorLayout";

const DoctorProfilePage = () => {
  return (
    <DoctorLayout>
      <UniversalProfessionalProfile userRole="doctor" />
    </DoctorLayout>
  );
};

export default DoctorProfilePage;
