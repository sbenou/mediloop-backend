
import React, { useState, useEffect } from 'react';
import { LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StampTemplate } from '../../utils';
import type { QuickToolbarProps } from './QuickToolbar';

type TemplatesTabProps = Pick<
  QuickToolbarProps, 
  'type' | 'availableTemplates' | 'handleApplyTemplate' | 'doctorName' | 'setDoctorName'
>;

const TemplatesTab: React.FC<TemplatesTabProps> = ({
  type,
  availableTemplates = [],
  handleApplyTemplate,
  doctorName = "",
  setDoctorName
}) => {
  const [localDoctorName, setLocalDoctorName] = useState(doctorName);

  // Update local state when prop changes
  useEffect(() => {
    setLocalDoctorName(doctorName);
  }, [doctorName]);

  // Update parent state when local state changes
  const updateDoctorName = (value: string) => {
    setLocalDoctorName(value);
    if (setDoctorName) {
      setDoctorName(value);
    }
  };

  // Filter templates based on type
  const getTemplatesForType = () => {
    if (type === 'signature') {
      // Only show signature templates for signature type
      return availableTemplates.filter(template => template.id === 'signature');
    } else {
      // For stamp type, show all except signature templates
      return availableTemplates.filter(template => template.id !== 'signature');
    }
  };

  const filteredTemplates = getTemplatesForType();

  return (
    <div className="p-3">
      <div className="space-y-4">
        <div>
          <Label htmlFor="doctor-name">Doctor Name (for templates)</Label>
          <Input
            id="doctor-name"
            value={localDoctorName}
            onChange={(e) => updateDoctorName(e.target.value)}
            placeholder="Dr. Name"
            className="mb-4"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredTemplates.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              className="justify-start"
              onClick={() => handleApplyTemplate?.(template.id, localDoctorName || undefined)}
            >
              <LayoutTemplate className="h-4 w-4 mr-2" />
              {template.name}
            </Button>
          ))}
        </div>
        
        {filteredTemplates.length === 0 && (
          <div className="text-center p-4 text-muted-foreground">
            {type === 'signature' 
              ? "No signature templates available." 
              : "No stamp templates available."}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplatesTab;
