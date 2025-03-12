
import React from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface StringHoursEditorProps {
  hoursString: string;
  onHoursChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

export const StringHoursEditor: React.FC<StringHoursEditorProps> = ({
  hoursString,
  onHoursChange,
  onCancel,
  onSave,
}) => {
  return (
    <div className="space-y-4">
      <textarea 
        value={hoursString}
        onChange={(e) => onHoursChange(e.target.value)}
        className="w-full p-2 border rounded resize-y min-h-[150px]"
        placeholder="Enter hours in format: Mon-Fri: 8:00-19:00, Sat: 9:00-13:00"
      />
      
      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={onSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Hours
        </Button>
      </div>
    </div>
  );
};
