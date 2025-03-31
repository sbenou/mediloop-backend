
import React from 'react';
import { 
  Pencil, 
  MousePointer,
  Circle, 
  Square, 
  Type, 
  RotateCcw, 
  RotateCw, 
  Upload, 
  Save, 
  Trash2,
  Calendar,
  CheckSquare,
  Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { QuickToolbarProps } from './QuickToolbar';

type ToolsTabProps = Pick<
  QuickToolbarProps, 
  'isDrawMode' | 'toggleDrawMode' | 'clearCanvas' | 'handleUndo' | 'handleRedo' | 
  'canUndo' | 'canRedo' | 'handleAddShape' | 'handleAddText' | 'triggerUpload' | 
  'saveCanvas' | 'isLoading' | 'handleAddDateField' | 'handleAddCheckbox' | 'selectedTool' | 'selectedShape' | 'setSelectedTool' | 'setIsDrawMode'
>;

const ToolsTab: React.FC<ToolsTabProps> = ({
  isDrawMode,
  toggleDrawMode,
  clearCanvas,
  handleUndo,
  handleRedo,
  canUndo,
  canRedo,
  handleAddShape,
  handleAddText,
  triggerUpload,
  saveCanvas,
  isLoading,
  handleAddDateField,
  handleAddCheckbox,
  selectedTool,
  selectedShape,
  setSelectedTool,
  setIsDrawMode
}) => {
  // New function to handle selection tool
  const handleSelectTool = () => {
    setSelectedTool('select');
    setIsDrawMode(false);
  };

  return (
    <div className="p-3">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedTool === 'draw' ? "default" : "outline"}
          size="icon"
          onClick={toggleDrawMode}
          title={isDrawMode ? "Finish Drawing" : "Draw"}
        >
          <Pencil className="h-4 w-4" />
        </Button>

        <Button
          variant={selectedTool === 'select' ? "default" : "outline"}
          size="icon"
          onClick={handleSelectTool}
          title="Select Tool"
        >
          <MousePointer className="h-4 w-4" />
        </Button>
        
        <Button
          variant={selectedTool === 'shape' && selectedShape === 'circle' ? "default" : "outline"}
          size="icon"
          onClick={() => handleAddShape('circle')}
          title="Add Circle"
        >
          <Circle className="h-4 w-4" />
        </Button>
        
        <Button
          variant={selectedTool === 'shape' && selectedShape === 'rectangle' ? "default" : "outline"}
          size="icon"
          onClick={() => handleAddShape('rectangle')}
          title="Add Rectangle"
        >
          <Square className="h-4 w-4" />
        </Button>
        
        <Button
          variant={selectedTool === 'shape' && selectedShape === 'line' ? "default" : "outline"}
          size="icon"
          onClick={() => handleAddShape('line')}
          title="Add Line"
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <Button
          variant={selectedTool === 'text' ? "default" : "outline"}
          size="icon"
          onClick={handleAddText}
          title="Add Text"
        >
          <Type className="h-4 w-4" />
        </Button>
        
        {handleAddDateField && (
          <Button
            variant={selectedTool === 'date' ? "default" : "outline"}
            size="icon"
            onClick={handleAddDateField}
            title="Add Date Field"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        )}
        
        {handleAddCheckbox && (
          <Button
            variant={selectedTool === 'checkbox' ? "default" : "outline"}
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
    </div>
  );
};

export default ToolsTab;
