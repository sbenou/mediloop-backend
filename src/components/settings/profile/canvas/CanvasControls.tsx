
import React from 'react';
import MenuBar from './controls/MenuBar';
import SaveButton from './controls/SaveButton';
import { StampTemplate } from './canvasUtils';

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
  handleAddDateField?: () => void;
  handleAddCheckbox?: (checked: boolean) => void;
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
  return (
    <div className="space-y-3">
      <MenuBar
        isDrawMode={isDrawMode}
        toggleDrawMode={toggleDrawMode}
        clearCanvas={clearCanvas}
        penColor={penColor}
        brushSize={brushSize}
        handleColorChange={handleColorChange}
        handleBrushSizeChange={handleBrushSizeChange}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        handleToggleGrid={handleToggleGrid}
        showGrid={showGrid}
        handleAddShape={handleAddShape}
        handleAddText={handleAddText}
        handleRotate={handleRotate}
        selectedTool={selectedTool}
        selectedShape={selectedShape}
        triggerUpload={triggerUpload}
        type={type}
        availableTemplates={availableTemplates}
        handleApplyTemplate={handleApplyTemplate}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        handleResizeCanvas={handleResizeCanvas}
        selectedImage={selectedImage}
        filterOptions={filterOptions}
        handleApplyFilter={handleApplyFilter}
        handleBringForward={handleBringForward}
        handleSendBackward={handleSendBackward}
        handleBringToFront={handleBringToFront}
        handleSendToBack={handleSendToBack}
        handleExport={handleExport}
        handleAddDateField={handleAddDateField}
        handleAddCheckbox={handleAddCheckbox}
      />
      
      <SaveButton 
        saveCanvas={saveCanvas} 
        isLoading={isLoading} 
        type={type} 
      />
    </div>
  );
};

export default CanvasControls;
