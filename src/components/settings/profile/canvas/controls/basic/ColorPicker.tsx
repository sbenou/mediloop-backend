
import React from 'react';
import { TooltipProvider } from "@/components/ui/tooltip";

interface ColorPickerProps {
  penColor: string;
  handleColorChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ penColor, handleColorChange }) => {
  const predefinedColors = [
    '#000000', // Black
    '#0000FF', // Blue
    '#FF0000', // Red
    '#008000', // Green
    '#800080'  // Purple
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-2 bg-muted px-2 py-1 rounded-md">
        <div className="text-xs text-muted-foreground">Color:</div>
        <input 
          type="color" 
          value={penColor} 
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-6 h-6 rounded border border-gray-300"
        />
        <div className="flex items-center space-x-1">
          {predefinedColors.map(color => (
            <button 
              key={color}
              onClick={() => handleColorChange(color)}
              className={`w-6 h-6 rounded ${penColor === color ? 'ring-2 ring-primary' : 'border border-gray-300'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ColorPicker;
