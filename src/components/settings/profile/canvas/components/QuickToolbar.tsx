
import React, { useState } from 'react';
import { 
  Pencil, 
  Eraser, 
  Circle, 
  Square, 
  Type, 
  RotateCcw, 
  RotateCw, 
  Upload, 
  Save, 
  Trash2,
  LayoutTemplate,
  Minus,
  Calendar,
  CheckSquare,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StampTemplate } from '../utils';

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
  // Template props
  type?: 'stamp' | 'signature';
  availableTemplates?: StampTemplate[];
  handleApplyTemplate?: (templateId: string, doctorName?: string) => void;
  doctorName?: string;
  setDoctorName?: (name: string) => void;
  // New props for additional functionality
  handleAddDateField?: () => void;
  handleAddCheckbox?: (checked: boolean) => void;
  handleExport?: (format: 'png' | 'jpeg' | 'svg' | 'pdf') => string | Blob | null;
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
  isLoading,
  // Template props
  type,
  availableTemplates,
  handleApplyTemplate,
  doctorName = "",
  setDoctorName,
  // New functionality
  handleAddDateField,
  handleAddCheckbox,
  handleExport
}) => {
  const [localDoctorName, setLocalDoctorName] = useState(doctorName || "");
  
  // Update parent state when local state changes
  const updateDoctorName = (value: string) => {
    setLocalDoctorName(value);
    if (setDoctorName) {
      setDoctorName(value);
    }
  };
  
  // Available colors for quick selection
  const colors = [
    "#000000", "#FF0000", "#0000FF", "#008000", 
    "#FFA500", "#800080", "#A52A2A", "#808080"
  ];

  // Show templates only for stamp type with available templates
  const showTemplates = type === 'stamp' && availableTemplates && handleApplyTemplate;

  // Show export options only when handleExport is available
  const showExport = !!handleExport;

  return (
    <div className="rounded-md border bg-card">
      <Tabs defaultValue="tools">
        <TabsList className="w-full border-b rounded-none">
          <TabsTrigger value="tools" className="flex-1">Basic Tools</TabsTrigger>
          <TabsTrigger value="draw" className="flex-1">Drawing</TabsTrigger>
          {showTemplates && (
            <TabsTrigger value="templates" className="flex-1">Templates</TabsTrigger>
          )}
          {showExport && (
            <TabsTrigger value="export" className="flex-1">Export</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="tools" className="p-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={isDrawMode ? "default" : "outline"}
              size="icon"
              onClick={toggleDrawMode}
              title={isDrawMode ? "Finish Drawing" : "Draw"}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleAddShape('circle')}
              title="Add Circle"
            >
              <Circle className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleAddShape('rectangle')}
              title="Add Rectangle"
            >
              <Square className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleAddShape('line')}
              title="Add Line"
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddText}
              title="Add Text"
            >
              <Type className="h-4 w-4" />
            </Button>
            
            {handleAddDateField && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleAddDateField}
                title="Add Date Field"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            )}
            
            {handleAddCheckbox && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleAddCheckbox(false)}
                title="Add Checkbox"
              >
                <CheckSquare className="h-4 w-4" />
              </Button>
            )}
            
            <Separator orientation="vertical" className="h-8" />
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleUndo}
              disabled={!canUndo}
              title="Undo"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleRedo}
              disabled={!canRedo}
              title="Redo"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-8" />
            
            <Button
              variant="outline"
              size="icon"
              onClick={triggerUpload}
              title="Upload Image"
            >
              <Upload className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={clearCanvas}
              title="Clear Canvas"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            
            <Button
              variant={isLoading ? "secondary" : "default"}
              size="sm"
              onClick={saveCanvas}
              disabled={isLoading}
              className="ml-auto"
            >
              {isLoading ? "Saving..." : "Save"}
              <Save className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="draw" className="p-3">
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
        </TabsContent>
        
        {showTemplates && (
          <TabsContent value="templates" className="p-3">
            <div className="space-y-4">
              <div>
                <Label htmlFor="doctor-name">Doctor Name (for templates)</Label>
                <Input
                  id="doctor-name"
                  value={localDoctorName}
                  onChange={(e) => updateDoctorName(e.target.value)}
                  placeholder="Dr. Name"
                  className="mb-4"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableTemplates?.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleApplyTemplate?.(template.id, localDoctorName || undefined)}
                  >
                    <LayoutTemplate className="h-4 w-4 mr-2" />
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        )}
        
        {showExport && (
          <TabsContent value="export" className="p-3">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => handleExport?.('png')}>
                  <Download className="h-4 w-4 mr-2" />
                  PNG
                </Button>
                <Button onClick={() => handleExport?.('jpeg')}>
                  <Download className="h-4 w-4 mr-2" />
                  JPEG
                </Button>
                <Button onClick={() => handleExport?.('svg')}>
                  <Download className="h-4 w-4 mr-2" />
                  SVG
                </Button>
                <Button onClick={() => handleExport?.('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default QuickToolbar;
