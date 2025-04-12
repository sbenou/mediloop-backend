
import React, { memo } from "react";
import { PharmacyView as OriginalPharmacyView } from "./views";

// Create a list of props to filter out - these are Lovable's internal props
const internalPropKeys = [
  "data-lov-id",
  "data-lov-name",
  "data-component-path",
  "data-component-line",
  "data-component-file",
  "data-component-name",
  "data-component-content"
];

// This is a re-export wrapper that ensures we properly import the component
const PharmacyView = memo((props: any) => {
  // Only log once during development to avoid spamming the console
  if (process.env.NODE_ENV === 'development') {
    console.log("PharmacyView wrapper called with props:", { 
      userRole: props.userRole, 
      section: props.section 
    });
  }
  
  // Create a new props object without Lovable's internal props
  const cleanedProps = Object.keys(props).reduce((acc, key) => {
    if (!internalPropKeys.includes(key)) {
      acc[key] = props[key];
    }
    return acc;
  }, {} as any);
  
  return <OriginalPharmacyView {...cleanedProps} />;
});

// Add displayName for better debugging
PharmacyView.displayName = 'PharmacyViewWrapper';

export default PharmacyView;
