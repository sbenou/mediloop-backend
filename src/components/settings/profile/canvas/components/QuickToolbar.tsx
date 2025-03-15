
import React from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { 
  Pencil, 
  Undo, 
  Redo, 
  Square, 
  Circle, 
  Type, 
  Save, 
  Upload, 
  Trash2, 
  Minus
} from "lucide-react";

interface QuickToolbarProps {
  isDrawMode: boolean;
  toggleDrawMode: () => void;
  clearCanvas: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  handleAddShape: (shape: 'circle' | 'rectangle' | 'line') => void;
  handleAddText: () => void;
  penColor: string;
  handleColorChange: (color: string) => void;
  brushSize: number;
  handleBrushSizeChange: (size: number) => void;
  triggerUpload: () => void;
  saveCanvas: () => void;
  isLoading: boolean;
}

const QuickToolbar: React.FC<QuickToolbarProps> = ({
  isDrawMode,
  toggleDrawMode,
  clearCanvas,
  handleUndo,
  handleRedo,
  canUndo,
  canRedo,
  handleAddShape,
  handleAddText,
  penColor,
  handleColorChange,
  brushSize,
  handleBrushSizeChange,
  triggerUpload,
  saveCanvas,
  isLoading
}) => {
  // Predefined colors for quick access
  const colors = [
    '#000000', '#0000FF', '#FF0000', '#008000', '#800080'
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-muted/20 rounded-md">
      <div className="flex items-center gap-1">
        <TooltipProvider>
          {/* Drawing tools */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="icon" 
                variant={isDrawMode ? "default" : "outline"}
                onClick={toggleDrawMode}
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isDrawMode ? "Exit Drawing Mode" : "Draw"}</TooltipContent>
          </Tooltip>
          
          {/* Shapes */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="icon" 
                variant="outline"
                onClick={() => handleAddShape('rectangle')}
                className="h-8 w-8"
              >
                <Square className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Rectangle</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="icon" 
                variant="outline"
                onClick={() => handleAddShape('circle')}
                className="h-8 w-8"
              >
                <Circle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Circle</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="icon" 
                variant="outline"
                onClick={() => handleAddShape('line')}
                className="h-8 w-8"
              >
                <Minus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Line</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="icon" 
                variant="outline"
                onClick={handleAddText}
                className="h-8 w-8"
              >
                <Type className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Text</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Separator orientation="vertical" className="h-8" />
      
      {/* Color picker */}
      <div className="flex items-center gap-1">
        {colors.map(color => (
          <button
            key={color}
            className={`h-6 w-6 rounded-full border ${penColor === color ? 'ring-2 ring-primary' : 'border-gray-300'}`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorChange(color)}
          />
        ))}
      </div>
      
      {/* Brush size */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Size:</span>
        <Slider
          value={[brushSize]}
          min={1}
          max={20}
          step={1}
          className="w-24"
          onValueChange={(value) => handleBrushSizeChange(value[0])}
        />
      </div>
      
      <Separator orientation="vertical" className="h-8" />
      
      <div className="flex items-center gap-1">
        <TooltipProvider>
          {/* Undo/Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="icon" 
                variant="outline"
                disabled={!canUndo}
                onClick={handleUndo}
                className="h-8 w-8"
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="icon" 
                variant="outline"
                disabled={!canRedo}
                onClick={handleRedo}
                className="h-8 w-8"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>
          
          {/* Save, Upload, Clear */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="icon" 
                variant="outline"
                onClick={triggerUpload}
                className="h-8 w-8"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Upload Image</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="icon" 
                variant="destructive"
                onClick={clearCanvas}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear Canvas</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="icon" 
                variant="default"
                onClick={saveCanvas}
                disabled={isLoading}
                className="h-8 w-8"
              >
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default QuickToolbar;
