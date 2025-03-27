
import React from "react";
import UniversalProfessionalProfile from "@/components/profile/UniversalProfessionalProfile";
import PharmacistLayout from "@/components/layout/PharmacistLayout";

const PharmacyProfile = () => {
  return (
    <PharmacistLayout>
      <UniversalProfessionalProfile userRole="pharmacist" />
    </PharmacistLayout>
  );
};

export default PharmacyProfile;
