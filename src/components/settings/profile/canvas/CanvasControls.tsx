
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StampTemplate } from './canvasUtils';
import BasicToolsTab from './controls/BasicToolsTab';
import TemplatesTab from './controls/TemplatesTab';
import AdvancedTab from './controls/AdvancedTab';
import ExportTab from './controls/ExportTab';
import SaveButton from './controls/SaveButton';

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
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [doctorName, setDoctorName] = useState("");
  const [canvasWidthInput, setCanvasWidthInput] = useState(canvasWidth.toString());
  const [canvasHeightInput, setCanvasHeightInput] = useState(canvasHeight.toString());

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
          <BasicToolsTab
            isDrawMode={isDrawMode}
            toggleDrawMode={toggleDrawMode}
            clearCanvas={clearCanvas}
            triggerUpload={triggerUpload}
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
          />
          
          <SaveButton 
            saveCanvas={saveCanvas} 
            isLoading={isLoading} 
            type={type} 
          />
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <TemplatesTab
            availableTemplates={availableTemplates}
            handleApplyTemplate={handleApplyTemplate}
            doctorName={doctorName}
            setDoctorName={setDoctorName}
          />
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-4">
          <AdvancedTab
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            canvasWidthInput={canvasWidthInput}
            canvasHeightInput={canvasHeightInput}
            handleWidthChange={handleWidthChange}
            handleHeightChange={handleHeightChange}
            applyCanvasResize={applyCanvasResize}
            handleResizeCanvas={handleResizeCanvas}
            handleBringForward={handleBringForward}
            handleSendBackward={handleSendBackward}
            handleBringToFront={handleBringToFront}
            handleSendToBack={handleSendToBack}
            selectedImage={selectedImage}
            filterOptions={filterOptions}
            handleApplyFilter={handleApplyFilter}
          />
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <ExportTab handleExport={handleExport} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CanvasControls;
