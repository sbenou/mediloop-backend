
import React from "react";
import { PharmacyView as OriginalPharmacyView } from "./views";

// This is a re-export wrapper to fix the import path issue
const PharmacyView = (props: any) => {
  return <OriginalPharmacyView {...props} />;
};

export default PharmacyView;
