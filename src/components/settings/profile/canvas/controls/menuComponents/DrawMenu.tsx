
import React from 'react';
import { MenubarItem, MenubarSeparator } from "@/components/ui/menubar";
import { Pencil } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface DrawMenuProps {
  isDrawMode: boolean;
  toggleDrawMode: () => void;
  brushSize: number;
  handleBrushSizeChange: (size: number) => void;
  penColor: string;
  handleColorChange: (color: string) => void;
}

const DrawMenu: React.FC<DrawMenuProps> = ({
  isDrawMode,
  toggleDrawMode,
  brushSize,
  handleBrushSizeChange,
  penColor,
  handleColorChange
}) => {
  // Available colors for quick selection
  const colors = [
    "#000000", "#FF0000", "#0000FF", "#008000", 
    "#FFA500", "#800080", "#A52A2A", "#808080"
  ];

  return (
    <>
      <MenubarItem onClick={toggleDrawMode} className={isDrawMode ? "bg-muted" : ""}>
        <Pencil className="mr-2 h-4 w-4" />
        Drawing Mode {isDrawMode ? "(On)" : "(Off)"}
      </MenubarItem>
      <MenubarSeparator />
      <div className="px-2 py-1.5">
        <div className="mb-2 text-sm font-medium">Brush Size: {brushSize}px</div>
        <Slider
          value={[brushSize]}
          min={1}
          max={50}
          step={1}
          onValueChange={(value) => handleBrushSizeChange(value[0])}
          className="w-48"
        />
      </div>
      <MenubarSeparator />
      <div className="px-2 py-1.5">
        <div className="mb-2 text-sm font-medium">Color</div>
        <div className="grid grid-cols-4 gap-1">
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
    </>
  );
};

export default DrawMenu;
