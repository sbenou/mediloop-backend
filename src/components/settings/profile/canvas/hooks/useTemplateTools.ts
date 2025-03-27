
import { useState } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { StampTemplate } from '../utils';

export interface UseTemplateToolsProps {
  canvas: FabricCanvas | null;
  templates: StampTemplate[];
}

export const useTemplateTools = ({ canvas, templates }: UseTemplateToolsProps) => {
  const [availableTemplates] = useState<StampTemplate[]>(templates);

  // Apply a template - fixed to use renderTemplate instead of applyTemplate
  const handleApplyTemplate = (templateId: string, doctorName?: string) => {
    if (!canvas) return;
    
    const template = availableTemplates.find(t => t.id === templateId);
    if (template) {
      template.renderTemplate(canvas, doctorName);
    }
  };

  return {
    availableTemplates,
    handleApplyTemplate
  };
};
