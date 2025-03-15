
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { QuickToolbarProps } from './QuickToolbar';

type DrawingTabProps = Pick<
  QuickToolbarProps, 
  'penColor' | 'handleColorChange' | 'brushSize' | 'handleBrushSizeChange'
>;

const DrawingTab: React.FC<DrawingTabProps> = ({
  penColor,
  handleColorChange,
  brushSize,
  handleBrushSizeChange
}) => {
  // Available colors for quick selection
  const colors = [
    "#000000", "#FF0000", "#0000FF", "#008000", 
    "#FFA500", "#800080", "#A52A2A", "#808080"
  ];

  return (
    <div className="p-3">
      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">Pen Color</Label>
          <div className="grid grid-cols-8 gap-2">
            {colors.map((color) => (
              <div
                key={color}
                className={`h-6 w-6 rounded-full cursor-pointer border ${
                  penColor === color ? "ring-2 ring-primary" : ""
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
              />
            ))}
          </div>
        </div>
        
        <div>
          <Label className="mb-2 block">Brush Size: {brushSize}px</Label>
          <div className="flex items-center gap-4">
            <span className="text-xs">1px</span>
            <Input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => handleBrushSizeChange(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs">50px</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawingTab;
