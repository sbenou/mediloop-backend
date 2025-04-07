
import React from "react";

interface PharmacyHeaderProps {
  title: string;
  description: string;
}

const PharmacyHeader: React.FC<PharmacyHeaderProps> = ({ title, description }) => {
  return (
    <div className="text-center mb-6">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default PharmacyHeader;
