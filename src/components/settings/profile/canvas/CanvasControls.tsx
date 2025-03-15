
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
  Minus as LineIcon, // Using Minus icon as a substitute for line
  Filter,
  Layers,
  MoveUp,
  MoveDown,
  ArrowUp,
  ArrowDown,
  LayoutTemplate,
  Download,
  Maximize,
  Minimize
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StampTemplate } from './canvasUtils';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  // New props for advanced features
  availableTemplates?: StampTemplate[];
  handleApplyTemplate?: (templateId: string, doctorName?: string) => void;
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
  handleExport?: (format: 'png' | 'jpeg' | 'svg' | 'pdf') => string | Blob | null;
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
  selectedShape,
  // New props
  availableTemplates = [],
  handleApplyTemplate,
  canvasWidth = 0,
  canvasHeight = 0,
  handleResizeCanvas,
  selectedImage,
  filterOptions = { brightness: 0, contrast: 0, grayscale: false, sepia: false },
  handleApplyFilter,
  handleBringForward,
  handleSendBackward,
  handleBringToFront,
  handleSendToBack,
  handleExport
}) => {
  const [showBrushSizeSlider, setShowBrushSizeSlider] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [canvasWidthInput, setCanvasWidthInput] = useState(canvasWidth.toString());
  const [canvasHeightInput, setCanvasHeightInput] = useState(canvasHeight.toString());
  const [doctorName, setDoctorName] = useState("");

  const predefinedColors = [
    '#000000', // Black
    '#0000FF', // Blue
    '#FF0000', // Red
    '#008000', // Green
    '#800080'  // Purple
  ];

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCanvasWidthInput(e.target.value);
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCanvasHeightInput(e.target.value);
  };

  const applyCanvasResize = () => {
    if (handleResizeCanvas) {
      const width = parseInt(canvasWidthInput);
      const height = parseInt(canvasHeightInput);
      if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
        handleResizeCanvas(width, height);
      }
    }
  };

  const exportToFormat = (format: 'png' | 'jpeg' | 'svg' | 'pdf') => {
    if (handleExport) {
      handleExport(format);
    }
  };

  return (
    <div className="space-y-3">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>
        
        {/* Basic Tools Tab */}
        <TabsContent value="basic" className="space-y-4">
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
              
              {/* Toggle grid */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showGrid ? "default" : "outline"}
                    size="sm"
                    onClick={handleToggleGrid}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle Grid</TooltipContent>
              </Tooltip>
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
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="template-doctor-name">Doctor Name (for templates)</Label>
              <Input 
                id="template-doctor-name" 
                value={doctorName} 
                onChange={(e) => setDoctorName(e.target.value)} 
                placeholder="Dr. Name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableTemplates.map(template => (
              <Card key={template.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mb-2">
                    <img 
                      src={template.thumbnail} 
                      alt={template.name} 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <Button 
                    onClick={() => handleApplyTemplate?.(template.id, doctorName || undefined)}
                    size="sm"
                    className="w-full"
                  >
                    <LayoutTemplate className="h-3 w-3 mr-2" />
                    {template.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          {/* Canvas Size Controls */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Canvas Size</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="canvas-width">Width</Label>
                <div className="flex">
                  <Input
                    id="canvas-width"
                    type="number"
                    min="50"
                    max="1000"
                    value={canvasWidthInput}
                    onChange={handleWidthChange}
                  />
                  <span className="ml-1 self-center text-sm text-muted-foreground">px</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="canvas-height">Height</Label>
                <div className="flex">
                  <Input
                    id="canvas-height"
                    type="number"
                    min="50"
                    max="1000"
                    value={canvasHeightInput}
                    onChange={handleHeightChange}
                  />
                  <span className="ml-1 self-center text-sm text-muted-foreground">px</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={applyCanvasResize} 
                className="flex-1"
              >
                Apply Size
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleResizeCanvas?.(320, 200)}
                className="flex-none"
              >
                <Minimize className="h-3 w-3 mr-1" />
                Small
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleResizeCanvas?.(450, 280)}
                className="flex-none"
              >
                <Maximize className="h-3 w-3 mr-1" />
                Large
              </Button>
            </div>
          </div>
          
          <Separator />
          
          {/* Layer Controls */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Layers</h4>
            <div className="grid grid-cols-4 gap-2">
              <Button size="sm" onClick={handleBringToFront} disabled={!handleBringToFront}>
                <ArrowUp className="h-4 w-4 mr-1" />
                Front
              </Button>
              <Button size="sm" onClick={handleBringForward} disabled={!handleBringForward}>
                <MoveUp className="h-4 w-4 mr-1" />
                Forward
              </Button>
              <Button size="sm" onClick={handleSendBackward} disabled={!handleSendBackward}>
                <MoveDown className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button size="sm" onClick={handleSendToBack} disabled={!handleSendToBack}>
                <ArrowDown className="h-4 w-4 mr-1" />
                Bottom
              </Button>
            </div>
          </div>
          
          <Separator />
          
          {/* Image Filters - Only shown when an image is selected */}
          {selectedImage && handleApplyFilter && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Image Filters
              </h4>
              
              <div className="space-y-4">
                {/* Brightness */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label htmlFor="brightness">Brightness</Label>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(filterOptions.brightness * 100)}%
                    </span>
                  </div>
                  <Slider
                    id="brightness"
                    min={-1}
                    max={1}
                    step={0.05}
                    value={[filterOptions.brightness]}
                    onValueChange={(value) => handleApplyFilter('brightness', value[0])}
                  />
                </div>
                
                {/* Contrast */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label htmlFor="contrast">Contrast</Label>
                    <span className="text-xs text-muted-foreground">
                      {Math.round((filterOptions.contrast + 1) * 50)}%
                    </span>
                  </div>
                  <Slider
                    id="contrast"
                    min={-1}
                    max={1}
                    step={0.05}
                    value={[filterOptions.contrast]}
                    onValueChange={(value) => handleApplyFilter('contrast', value[0])}
                  />
                </div>
                
                {/* Grayscale & Sepia toggles */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="grayscale"
                      checked={filterOptions.grayscale}
                      onCheckedChange={(checked) => 
                        handleApplyFilter('grayscale', checked ? 1 : 0)
                      }
                    />
                    <Label htmlFor="grayscale">Grayscale</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sepia"
                      checked={filterOptions.sepia}
                      onCheckedChange={(checked) => 
                        handleApplyFilter('sepia', checked ? 1 : 0)
                      }
                    />
                    <Label htmlFor="sepia">Sepia</Label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => exportToFormat('png')} disabled={!handleExport}>
              <Download className="h-4 w-4 mr-2" />
              PNG
            </Button>
            <Button onClick={() => exportToFormat('jpeg')} disabled={!handleExport}>
              <Download className="h-4 w-4 mr-2" />
              JPEG
            </Button>
            <Button onClick={() => exportToFormat('svg')} disabled={!handleExport}>
              <Download className="h-4 w-4 mr-2" />
              SVG
            </Button>
            <Button onClick={() => exportToFormat('pdf')} disabled={!handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Download As Image
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CanvasControls;
