
import React from 'react';
import { MenubarItem } from "@/components/ui/menubar";
import { LayoutTemplate } from "lucide-react";
import { StampTemplate } from '../../utils';

interface TemplatesMenuProps {
  doctorName: string;
  setDoctorName: React.Dispatch<React.SetStateAction<string>>;
  availableTemplates: StampTemplate[];
  handleApplyTemplate: (templateId: string, doctorName?: string) => void;
}

const TemplatesMenu: React.FC<TemplatesMenuProps> = ({
  doctorName,
  setDoctorName,
  availableTemplates,
  handleApplyTemplate
}) => {
  return (
    <>
      <div className="px-2 py-1.5 mb-2">
        <input
          type="text"
          placeholder="Doctor Name"
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
          className="w-full p-1 text-sm border rounded"
        />
      </div>
      {availableTemplates.map((template) => (
        <MenubarItem 
          key={template.id}
          onClick={() => handleApplyTemplate(template.id, doctorName || undefined)}
        >
          <LayoutTemplate className="mr-2 h-4 w-4" />
          {template.name}
        </MenubarItem>
      ))}
    </>
  );
};

export default TemplatesMenu;
