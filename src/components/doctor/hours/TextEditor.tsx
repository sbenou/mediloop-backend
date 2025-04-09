
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface TextEditorProps {
  hoursText: string;
  onHoursTextChange: (text: string) => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  hoursText,
  onHoursTextChange,
  onCancel,
  onSave,
  isSaving
}) => {
  return (
    <div className="space-y-4">
      <Textarea
        value={hoursText}
        onChange={(e) => onHoursTextChange(e.target.value)}
        placeholder="Monday to Friday: 9:00 - 17:00&#10;Saturday: 10:00 - 13:00&#10;Sunday: Closed"
        rows={5}
      />
      
      <div className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button 
          variant="default"
          size="sm" 
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};
