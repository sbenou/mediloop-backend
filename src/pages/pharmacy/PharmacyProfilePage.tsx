
import React from "react";
import ProfessionalProfile from "@/components/professional/ProfessionalProfile";
import PharmacistLayout from "@/components/layout/PharmacistLayout";

const PharmacyProfilePage = () => {
  return (
    <PharmacistLayout>
      <div className="container px-4 py-4 md:py-8 mx-auto max-w-7xl">
        <ProfessionalProfile role="pharmacy" />
      </div>
    </PharmacistLayout>
  );
};

export default PharmacyProfilePage;
