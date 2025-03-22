
import React from "react";

const ConsultationsLoading: React.FC = () => {
  return (
    <div className="flex justify-center items-center p-10">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <span className="ml-2">Loading teleconsultations...</span>
    </div>
  );
};

export default ConsultationsLoading;
