
import React from "react";

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
}

const SidebarSection = ({ title, children }: SidebarSectionProps) => {
  return (
    <div className="mb-6">
      <h2 className="mb-2 px-6 text-xs font-semibold tracking-wider uppercase text-gray-500">
        {title}
      </h2>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
};

export default SidebarSection;
