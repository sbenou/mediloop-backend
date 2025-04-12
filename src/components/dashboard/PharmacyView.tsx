
import React, { memo } from "react";
import { PharmacyView as OriginalPharmacyView } from "./views";

// This is a re-export wrapper that ensures we properly import the component
// Using memo to prevent unnecessary re-renders
const PharmacyView = memo((props: any) => {
  // Only log once during development to avoid spamming the console
  if (process.env.NODE_ENV === 'development') {
    console.log("PharmacyView wrapper called with props:", { userRole: props.userRole, section: props.section });
  }
  
  // Filter out Lovable's internal props to avoid passing them to the component
  const { 
    "data-lov-id": _, 
    "data-lov-name": __, 
    "data-component-path": ___, 
    "data-component-line": ____, 
    "data-component-file": _____, 
    "data-component-name": ______, 
    "data-component-content": _______, 
    ...cleanedProps 
  } = props;
  
  return <OriginalPharmacyView {...cleanedProps} />;
});

// Add displayName for better debugging
PharmacyView.displayName = 'PharmacyViewWrapper';

export default PharmacyView;
