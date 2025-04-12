
import React from "react";
import { PharmacyView as OriginalPharmacyView } from "./views";

// This is a re-export wrapper that ensures we properly import the component
const PharmacyView = (props: any) => {
  console.log("PharmacyView wrapper called with props:", props);
  return <OriginalPharmacyView {...props} />;
};

export default PharmacyView;
