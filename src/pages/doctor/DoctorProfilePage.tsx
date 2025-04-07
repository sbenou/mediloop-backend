
import React from "react";
import ProfessionalProfile from "@/components/professional/ProfessionalProfile";
import DoctorLayout from "@/components/layout/DoctorLayout";

const DoctorProfilePage = () => {
  return (
    <DoctorLayout>
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl">
        <ProfessionalProfile role="doctor" />
      </div>
    </DoctorLayout>
  );
};

export default DoctorProfilePage;
