
import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Pencil, 
  Save, 
  Trash2, 
  Upload, 
  Undo, 
  Redo, 
  Circle, 
  Square, 
  Type, 
  Grid, 
  RotateCw, 
  RotateCcw, 
  Minus, 
  Plus, 
  Minus as LineIcon // Using Minus icon as a substitute for line
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface CanvasControlsProps {
  isDrawMode: boolean;
  toggleDrawMode: () => void;
  clearCanvas: () => void;
  triggerUpload: () => void;
  saveCanvas: () => void;
  isLoading: boolean;
  penColor: string;
  brushSize: number;
  handleColorChange: (color: string) => void;
  handleBrushSizeChange: (size: number) => void;
  type: 'stamp' | 'signature';
  handleUndo: () => void;
  handleRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  handleToggleGrid: () => void;
  showGrid: boolean;
  handleAddShape: (shape: 'circle' | 'rectangle' | 'line') => void;
  handleAddText: () => void;
  handleRotate: (angle: number) => void;
  selectedTool: string;
  selectedShape: 'circle' | 'rectangle' | 'line' | null;
}

const CanvasControls: React.FC<CanvasControlsProps> = ({
  isDrawMode,
  toggleDrawMode,
  clearCanvas,
  triggerUpload,
  saveCanvas,
  isLoading,
  penColor,
  brushSize,
  handleColorChange,
  handleBrushSizeChange,
  type,
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
  selectedShape
}) => {
  const [showBrushSizeSlider, setShowBrushSizeSlider] = useState(false);

  const predefinedColors = [
    '#000000', // Black
    '#0000FF', // Blue
    '#FF0000', // Red
    '#008000', // Green
    '#800080'  // Purple
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <TooltipProvider>
          {/* Color picker section */}
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

          {/* Brush size control */}
          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={showBrushSizeSlider ? "bg-accent" : ""}
                  onClick={() => setShowBrushSizeSlider(!showBrushSizeSlider)}
                >
                  <span className="w-2 h-2 bg-foreground rounded-full mr-1"></span>
                  <span className="text-xs">{brushSize}px</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Brush Size</TooltipContent>
            </Tooltip>
            
            {showBrushSizeSlider && (
              <div className="absolute mt-1 p-3 bg-background border rounded-md shadow-md w-40 z-50">
                <div className="flex items-center gap-2">
                  <Minus className="h-3 w-3 text-muted-foreground" />
                  <Slider
                    value={[brushSize]}
                    min={1}
                    max={20}
                    step={1}
                    onValueChange={(value) => handleBrushSizeChange(value[0])}
                    className="flex-1"
                  />
                  <Plus className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </TooltipProvider>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <ToggleGroup type="single" className="justify-start flex-wrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem 
                    value="draw" 
                    aria-label="Toggle drawing mode"
                    data-state={isDrawMode ? "on" : "off"}
                    onClick={toggleDrawMode}
                  >
                    <Pencil className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isDrawMode ? "Finish Drawing" : "Draw"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem 
                    value="circle" 
                    aria-label="Add circle"
                    data-state={selectedTool === 'shape' && selectedShape === 'circle' ? "on" : "off"}
                    onClick={() => handleAddShape('circle')}
                  >
                    <Circle className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent side="bottom">Add Circle</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem 
                    value="rectangle" 
                    aria-label="Add rectangle"
                    data-state={selectedTool === 'shape' && selectedShape === 'rectangle' ? "on" : "off"}
                    onClick={() => handleAddShape('rectangle')}
                  >
                    <Square className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent side="bottom">Add Rectangle</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem 
                    value="line" 
                    aria-label="Add line"
                    data-state={selectedTool === 'shape' && selectedShape === 'line' ? "on" : "off"}
                    onClick={() => handleAddShape('line')}
                  >
                    <LineIcon className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent side="bottom">Add Line</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem 
                    value="text" 
                    aria-label="Add text"
                    data-state={selectedTool === 'text' ? "on" : "off"}
                    onClick={handleAddText}
                  >
                    <Type className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent side="bottom">Add Text</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem 
                    value="grid" 
                    aria-label="Toggle grid"
                    data-state={showGrid ? "on" : "off"}
                    onClick={handleToggleGrid}
                  >
                    <Grid className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent side="bottom">Toggle Grid</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </ToggleGroup>
        </div>

        <div className="col-span-2 flex flex-wrap gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleUndo()}
                  disabled={!canUndo}
                >
                  <Undo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Undo</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRedo()}
                  disabled={!canRedo}
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Redo</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRotate(-15)}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Rotate Left</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRotate(15)}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Rotate Right</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={triggerUpload}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Upload Image</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearCanvas}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Clear Canvas</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <Button
          onClick={saveCanvas}
          size="sm"
          className="col-span-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="animate-spin h-4 w-4 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save {type === 'stamp' ? 'Stamp' : 'Signature'}
        </Button>
      </div>
    </div>
  );
};

export default CanvasControls;
