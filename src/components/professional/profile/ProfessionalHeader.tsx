
import React from "react";

interface ProfessionalHeaderProps {
  title: string;
  description: string;
  role: 'doctor' | 'pharmacy';
}

const ProfessionalHeader: React.FC<ProfessionalHeaderProps> = ({ 
  title, 
  description,
  role 
}) => {
  const roleSpecificClass = role === 'doctor' ? 'doctor-header' : 'pharmacy-header';
  
  return (
    <div className={`text-center mb-6 ${roleSpecificClass}`}>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default ProfessionalHeader;
