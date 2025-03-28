
import { useState } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { StampTemplate } from '../utils';

export interface UseTemplateToolsProps {
  canvas: FabricCanvas | null;
  templates: StampTemplate[];
}

export const useTemplateTools = ({ canvas, templates }: UseTemplateToolsProps) => {
  const [availableTemplates] = useState<StampTemplate[]>(templates);

  // Apply a template properly
  const handleApplyTemplate = (templateId: string, doctorName?: string) => {
    if (!canvas) return;
    
    try {
      const template = availableTemplates.find(t => t.id === templateId);
      if (template) {
        // Make sure canvas is in selection mode before applying template
        canvas.isDrawingMode = false;
        
        // Ensure white background
        canvas.backgroundColor = '#ffffff';
        
        // Use the template's render function
        template.renderTemplate(canvas, doctorName);
        
        // Force render to make sure template is visible
        canvas.renderAll();
        
        console.log(`Applied template: ${templateId}`);
      } else {
        console.error(`Template not found: ${templateId}`);
      }
    } catch (error) {
      console.error("Error applying template:", error);
    }
  };

  return {
    availableTemplates,
    handleApplyTemplate
  };
};
