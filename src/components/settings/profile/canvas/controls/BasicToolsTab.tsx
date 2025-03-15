
import React from 'react';
import { Separator } from "@/components/ui/separator";
import { 
  ColorPicker,
  BrushSizeControl,
  GridToggle,
  DrawingTools,
  ActionButtons
} from './basic';

interface BasicToolsTabProps {
  isDrawMode: boolean;
  toggleDrawMode: () => void;
  clearCanvas: () => void;
  triggerUpload: () => void;
  penColor: string;
  brushSize: number;
  handleColorChange: (color: string) => void;
  handleBrushSizeChange: (size: number) => void;
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
  handleAddDateField?: () => void;
  handleAddCheckbox?: (checked: boolean) => void;
}

const BasicToolsTab: React.FC<BasicToolsTabProps> = (props) => {
  const {
    isDrawMode,
    toggleDrawMode,
    clearCanvas,
    triggerUpload,
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
    handleAddDateField,
    handleAddCheckbox
  } = props;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <ColorPicker 
          penColor={penColor}
          handleColorChange={handleColorChange}
        />
        
        <BrushSizeControl
          brushSize={brushSize}
          handleBrushSizeChange={handleBrushSizeChange}
        />
        
        <GridToggle
          showGrid={showGrid}
          handleToggleGrid={handleToggleGrid}
        />
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <DrawingTools
            isDrawMode={isDrawMode}
            toggleDrawMode={toggleDrawMode}
            handleAddShape={handleAddShape}
            handleAddText={handleAddText}
            selectedTool={selectedTool}
            selectedShape={selectedShape}
            handleAddDateField={handleAddDateField}
            handleAddCheckbox={handleAddCheckbox}
          />
        </div>

        <div className="col-span-2">
          <ActionButtons
            handleUndo={handleUndo}
            handleRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            handleRotate={handleRotate}
            triggerUpload={triggerUpload}
            clearCanvas={clearCanvas}
          />
        </div>
      </div>
    </div>
  );
};

export default BasicToolsTab;
