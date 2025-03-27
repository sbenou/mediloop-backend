
import React from "react";
import UniversalProfessionalProfile from "@/components/profile/UniversalProfessionalProfile";
import DoctorLayout from "@/components/layout/DoctorLayout";

const DoctorProfilePage = () => {
  return (
    <DoctorLayout>
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl">
        <UniversalProfessionalProfile userRole="doctor" renderLayout={false} />
      </div>
    </DoctorLayout>
  );
};

export default DoctorProfilePage;
