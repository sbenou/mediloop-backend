
import React from 'react';
import { LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StampTemplate } from '../utils';

interface TemplatesTabProps {
  availableTemplates: StampTemplate[];
  handleApplyTemplate?: (templateId: string, doctorName?: string) => void;
  doctorName: string;
  setDoctorName: (name: string) => void;
  type: 'stamp' | 'signature';
}

const TemplatesTab: React.FC<TemplatesTabProps> = ({
  availableTemplates,
  handleApplyTemplate,
  doctorName,
  setDoctorName,
  type
}) => {
  // Filter templates based on type
  const filteredTemplates = type === 'signature' 
    ? availableTemplates.filter(template => template.id === 'signature')
    : availableTemplates.filter(template => template.id !== 'signature');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="template-doctor-name">Doctor Name (for templates)</Label>
          <Input 
            id="template-doctor-name" 
            value={doctorName} 
            onChange={(e) => setDoctorName(e.target.value)} 
            placeholder="Dr. Name"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="overflow-hidden">
            <CardContent className="p-3">
              <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mb-2">
                <img 
                  src={template.thumbnail} 
                  alt={template.name} 
                  className="w-full h-full object-contain" 
                />
              </div>
              <Button 
                onClick={() => handleApplyTemplate?.(template.id, doctorName || undefined)}
                size="sm"
                className="w-full"
              >
                <LayoutTemplate className="h-3 w-3 mr-2" />
                {template.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredTemplates.length === 0 && (
        <div className="p-4 text-center text-muted-foreground">
          {type === 'signature' 
            ? "No signature templates available." 
            : "No stamp templates available."}
        </div>
      )}
    </div>
  );
};

export default TemplatesTab;
