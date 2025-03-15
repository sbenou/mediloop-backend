
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCanvasManager } from './useCanvasManager';
import CanvasControls from './CanvasControls';
import CanvasContainer from './components/CanvasContainer';
import { useFileUpload } from './hooks/useFileUpload';
import { useSaveCanvas } from './hooks/useSaveCanvas';

interface CanvasSectionProps {
  title: string;
  description: string;
  imageUrl: string | null;
  type: 'stamp' | 'signature';
  userId: string;
}

const CanvasSection: React.FC<CanvasSectionProps> = ({
  title,
  description,
  imageUrl,
  type,
  userId
}) => {
  // Initialize canvas and get canvas functionality
  const {
    canvasContainerRef,
    canvas,
    isDrawMode,
    penColor,
    brushSize,
    showGrid,
    canUndo,
    canRedo,
    selectedTool,
    selectedShape,
    toggleDrawMode,
    clearCanvas,
    handleColorChange,
    handleBrushSizeChange,
    handleUndo,
    handleRedo,
    handleToggleGrid,
    handleAddShape,
    handleAddText,
    handleRotate,
    // New functionality
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
    handleExport
  } = useCanvasManager({ imageUrl });

  // File upload functionality
  const { fileInputRef, triggerUpload, handleFileChange } = useFileUpload(canvas);

  // Save canvas functionality
  const { saveCanvas: saveCanvasToServer, isLoading } = useSaveCanvas(type, userId);

  // Save canvas wrapper function
  const saveCanvas = () => {
    if (canvas) {
      saveCanvasToServer(canvas);
    }
  };

  // Force white background but with safeguards against recursion
  useEffect(() => {
    if (!canvas) return;
    
    // Initial forced white background - just once
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    
    // Instead of an interval which could cause recursion, use a single timeout
    const timeout = setTimeout(() => {
      if (canvas) {
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
      }
    }, 200);
    
    return () => clearTimeout(timeout);
  }, [canvas]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          
          {/* Menu bar appears above the canvas */}
          <CanvasControls 
            isDrawMode={isDrawMode}
            toggleDrawMode={toggleDrawMode}
            clearCanvas={clearCanvas}
            triggerUpload={triggerUpload}
            saveCanvas={saveCanvas}
            isLoading={isLoading}
            penColor={penColor}
            brushSize={brushSize}
            handleColorChange={handleColorChange}
            handleBrushSizeChange={handleBrushSizeChange}
            type={type}
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
            // New functionality
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
          />
          
          <CanvasContainer canvasRef={canvasContainerRef} />
        </div>
      </CardContent>
    </Card>
  );
};

export default CanvasSection;
