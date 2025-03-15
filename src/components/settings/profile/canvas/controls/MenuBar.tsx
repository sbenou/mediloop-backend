import React, { useState } from 'react';
import { 
  Menubar, 
  MenubarMenu, 
  MenubarTrigger, 
  MenubarContent, 
  MenubarItem,
  MenubarSeparator,
  MenubarCheckboxItem,
} from "@/components/ui/menubar";
import { 
  Pencil, 
  Image, 
  CircleOff, 
  RotateCcw, 
  RotateCw, 
  Grid, 
  Square, 
  Circle,
  Type,
  Minus,
  Layers,
  Download,
  LayoutTemplate,
  ShieldQuestion,
  Scale,
  CalendarDays,
  CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { StampTemplate } from '../utils';

interface MenuBarProps {
  // Drawing tools
  isDrawMode: boolean;
  toggleDrawMode: () => void;
  clearCanvas: () => void;
  penColor: string;
  brushSize: number;
  handleColorChange: (color: string) => void;
  handleBrushSizeChange: (size: number) => void;
  
  // History
  handleUndo: () => void;
  handleRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Grid
  handleToggleGrid: () => void;
  showGrid: boolean;
  
  // Shapes
  handleAddShape: (shape: 'circle' | 'rectangle' | 'line') => void;
  handleAddText: () => void;
  handleRotate: (angle: number) => void;
  selectedTool: string;
  selectedShape: 'circle' | 'rectangle' | 'line' | null;
  
  // Upload
  triggerUpload: () => void;
  
  // Type specific
  type: 'stamp' | 'signature';
  
  // Templates - only for stamps
  availableTemplates?: StampTemplate[];
  handleApplyTemplate?: (templateId: string, doctorName?: string) => void;
  
  // Advanced
  canvasWidth?: number;
  canvasHeight?: number;
  handleResizeCanvas?: (width: number, height: number) => void;
  selectedImage?: any;
  filterOptions?: {
    brightness: number;
    contrast: number;
    grayscale: boolean;
    sepia: boolean;
  };
  handleApplyFilter?: (filterType: 'brightness' | 'contrast' | 'grayscale' | 'sepia', value: number) => void;
  handleBringForward?: () => void;
  handleSendBackward?: () => void;
  handleBringToFront?: () => void;
  handleSendToBack?: () => void;
  
  // Export
  handleExport?: (format: 'png' | 'jpeg' | 'svg' | 'pdf') => string | Blob | null;
  
  // New props
  handleAddDateField?: () => void;
  handleAddCheckbox?: (checked: boolean) => void;
  type: 'stamp' | 'signature';
}

const MenuBar: React.FC<MenuBarProps> = ({
  isDrawMode,
  toggleDrawMode,
  clearCanvas,
  penColor,
  brushSize,
  handleColorChange,
  handleBrushSizeChange,
  handleUndo,
  handleRedo,
  canUndo,
  canRedo,
  handleToggleGrid,
  showGrid,
  handleAddShape,
  handleAddText,
  handleRotate,
  selectedTool,
  selectedShape,
  triggerUpload,
  type,
  availableTemplates,
  handleApplyTemplate,
  canvasWidth,
  canvasHeight,
  handleResizeCanvas,
  selectedImage,
  filterOptions,
  handleApplyFilter,
  handleBringForward,
  handleSendBackward,
  handleBringToFront,
  handleSendToBack,
  handleExport,
  handleAddDateField,
  handleAddCheckbox
}) => {
  const [doctorName, setDoctorName] = useState("");
  
  // Available colors for quick selection
  const colors = [
    "#000000", "#FF0000", "#0000FF", "#008000", 
    "#FFA500", "#800080", "#A52A2A", "#808080"
  ];

  return (
    <Menubar className="border-none shadow-sm bg-gray-50 rounded-md p-1">
      {/* File Menu */}
      <MenubarMenu>
        <MenubarTrigger className="font-medium">File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={clearCanvas}>
            <CircleOff className="mr-2 h-4 w-4" />
            Clear Canvas
          </MenubarItem>
          <MenubarItem onClick={triggerUpload}>
            <Image className="mr-2 h-4 w-4" />
            Import Image
          </MenubarItem>
          <MenubarSeparator />
          {handleExport && (
            <>
              <MenubarItem onClick={() => handleExport('png')}>
                <Download className="mr-2 h-4 w-4" />
                Export as PNG
              </MenubarItem>
              <MenubarItem onClick={() => handleExport('jpeg')}>
                <Download className="mr-2 h-4 w-4" />
                Export as JPEG
              </MenubarItem>
              <MenubarItem onClick={() => handleExport('svg')}>
                <Download className="mr-2 h-4 w-4" />
                Export as SVG
              </MenubarItem>
              <MenubarItem onClick={() => handleExport('pdf')}>
                <Download className="mr-2 h-4 w-4" />
                Export as PDF
              </MenubarItem>
            </>
          )}
        </MenubarContent>
      </MenubarMenu>

      {/* Edit Menu */}
      <MenubarMenu>
        <MenubarTrigger className="font-medium">Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={handleUndo} disabled={!canUndo}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Undo
          </MenubarItem>
          <MenubarItem onClick={handleRedo} disabled={!canRedo}>
            <RotateCw className="mr-2 h-4 w-4" />
            Redo
          </MenubarItem>
          <MenubarSeparator />
          <MenubarCheckboxItem checked={showGrid} onCheckedChange={handleToggleGrid}>
            <Grid className="mr-2 h-4 w-4" />
            Show Grid
          </MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>

      {/* Draw Menu */}
      <MenubarMenu>
        <MenubarTrigger className="font-medium">Draw</MenubarTrigger>
        <MenubarContent>
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
        </MenubarContent>
      </MenubarMenu>

      {/* Insert Menu */}
      <MenubarMenu>
        <MenubarTrigger className="font-medium">Insert</MenubarTrigger>
        <MenubarContent>
          <MenubarItem onClick={() => handleAddShape('rectangle')}>
            <Square className="mr-2 h-4 w-4" />
            Rectangle
          </MenubarItem>
          <MenubarItem onClick={() => handleAddShape('circle')}>
            <Circle className="mr-2 h-4 w-4" />
            Circle
          </MenubarItem>
          <MenubarItem onClick={() => handleAddShape('line')}>
            <Minus className="mr-2 h-4 w-4" />
            Line
          </MenubarItem>
          <MenubarItem onClick={handleAddText}>
            <Type className="mr-2 h-4 w-4" />
            Text
          </MenubarItem>
          <MenubarSeparator />
          {handleAddDateField && (
            <MenubarItem onClick={handleAddDateField}>
              <CalendarDays className="mr-2 h-4 w-4" />
              Date Field
            </MenubarItem>
          )}
          {handleAddCheckbox && (
            <>
              <MenubarItem onClick={() => handleAddCheckbox(false)}>
                <CheckSquare className="mr-2 h-4 w-4" />
                Checkbox (Unchecked)
              </MenubarItem>
              <MenubarItem onClick={() => handleAddCheckbox(true)}>
                <CheckSquare className="mr-2 h-4 w-4 text-primary" />
                Checkbox (Checked)
              </MenubarItem>
            </>
          )}
        </MenubarContent>
      </MenubarMenu>

      {/* Templates Menu - only for stamps */}
      {type === 'stamp' && availableTemplates && handleApplyTemplate && (
        <MenubarMenu>
          <MenubarTrigger className="font-medium">Templates</MenubarTrigger>
          <MenubarContent>
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
          </MenubarContent>
        </MenubarMenu>
      )}

      {/* Advanced Menu */}
      <MenubarMenu>
        <MenubarTrigger className="font-medium">Advanced</MenubarTrigger>
        <MenubarContent>
          {/* Layer Management */}
          {handleBringForward && handleSendBackward && handleBringToFront && handleSendToBack && (
            <>
              <MenubarItem onClick={handleBringForward}>
                <Layers className="mr-2 h-4 w-4" />
                Bring Forward
              </MenubarItem>
              <MenubarItem onClick={handleSendBackward}>
                <Layers className="mr-2 h-4 w-4" />
                Send Backward
              </MenubarItem>
              <MenubarItem onClick={handleBringToFront}>
                <Layers className="mr-2 h-4 w-4" />
                Bring to Front
              </MenubarItem>
              <MenubarItem onClick={handleSendToBack}>
                <Layers className="mr-2 h-4 w-4" />
                Send to Back
              </MenubarItem>
              <MenubarSeparator />
            </>
          )}
          
          {/* Rotation */}
          <MenubarItem onClick={() => handleRotate(90)}>
            <RotateCw className="mr-2 h-4 w-4" />
            Rotate 90° Clockwise
          </MenubarItem>
          <MenubarItem onClick={() => handleRotate(-90)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Rotate 90° Counter-Clockwise
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      {/* Help Menu */}
      <MenubarMenu>
        <MenubarTrigger className="font-medium">Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <ShieldQuestion className="mr-2 h-4 w-4" />
            How to use
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};

export default MenuBar;
