
import React from 'react';
import MenuBar from './controls/MenuBar';
import ControlsContainer from './controls/ControlsContainer';
import { StampTemplate } from './canvasUtils';

interface CanvasControlsProps {
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
  
  // Save
  saveCanvas: () => void;
  isLoading: boolean;
  
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
}

const CanvasControls: React.FC<CanvasControlsProps> = (props) => {
  // Pass all menubar-related props to the MenuBar component
  // Use the ControlsContainer to wrap everything
  return (
    <ControlsContainer>
      <MenuBar
        isDrawMode={props.isDrawMode}
        toggleDrawMode={props.toggleDrawMode}
        clearCanvas={props.clearCanvas}
        penColor={props.penColor}
        brushSize={props.brushSize}
        handleColorChange={props.handleColorChange}
        handleBrushSizeChange={props.handleBrushSizeChange}
        handleUndo={props.handleUndo}
        handleRedo={props.handleRedo}
        canUndo={props.canUndo}
        canRedo={props.canRedo}
        handleToggleGrid={props.handleToggleGrid}
        showGrid={props.showGrid}
        handleAddShape={props.handleAddShape}
        handleAddText={props.handleAddText}
        handleRotate={props.handleRotate}
        selectedTool={props.selectedTool}
        selectedShape={props.selectedShape}
        triggerUpload={props.triggerUpload}
        type={props.type}
        availableTemplates={props.availableTemplates}
        handleApplyTemplate={props.handleApplyTemplate}
        canvasWidth={props.canvasWidth}
        canvasHeight={props.canvasHeight}
        handleResizeCanvas={props.handleResizeCanvas}
        selectedImage={props.selectedImage}
        filterOptions={props.filterOptions}
        handleApplyFilter={props.handleApplyFilter}
        handleBringForward={props.handleBringForward}
        handleSendBackward={props.handleSendBackward}
        handleBringToFront={props.handleBringToFront}
        handleSendToBack={props.handleSendToBack}
        handleExport={props.handleExport}
        handleAddDateField={props.handleAddDateField}
        handleAddCheckbox={props.handleAddCheckbox}
      />
    </ControlsContainer>
  );
};

export default CanvasControls;
