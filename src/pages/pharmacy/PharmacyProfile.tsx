
import React from "react";
import UniversalProfessionalProfile from "@/components/profile/UniversalProfessionalProfile";
import PharmacistLayout from "@/components/layout/PharmacistLayout";

const PharmacyProfile = () => {
  return (
    <PharmacistLayout>
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl">
        <UniversalProfessionalProfile userRole="pharmacist" />
      </div>
    </PharmacistLayout>
  );
};

export default PharmacyProfile;
