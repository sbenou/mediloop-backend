
import React from "react";

const ConsultationsLoading: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center p-10">
      <div className="relative">
        {/* Outer circle with thinner part */}
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        {/* Inner circle with thinner part - spinning in opposite direction */}
        <div className="h-6 w-6 rounded-full border-4 border-primary border-b-transparent animate-spin absolute top-3 left-3"></div>
      </div>
      <span className="mt-4 text-muted-foreground">Loading dashboard...</span>
    </div>
  );
};

export default ConsultationsLoading;
