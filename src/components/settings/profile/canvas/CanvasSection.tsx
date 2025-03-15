import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCanvasManager } from './useCanvasManager';
import CanvasControls from './CanvasControls';
import CanvasContainer from './components/CanvasContainer';
import { useFileUpload } from './hooks/useFileUpload';
import { useSaveCanvas } from './hooks/useSaveCanvas';
import QuickToolbar from './components/quicktoolbar';

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
  const [doctorName, setDoctorName] = useState("");
  
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
    handleExport,
    handleAddDateField,
    handleAddCheckbox
  } = useCanvasManager({ imageUrl });

  // File upload functionality
  const { fileInputRef, triggerUpload, handleFileChange } = useFileUpload(canvas);

  // Save canvas functionality
  const { saveCanvas: saveCanvasToServer, isLoading } = useSaveCanvas(type, userId);

  // Save canvas wrapper function
  const saveCanvas = () => {
    if (canvas) {
      // Force white background before saving
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
      saveCanvasToServer(canvas);
    }
  };

  // Force white background whenever canvas changes and ensure proper drawing setup
  useEffect(() => {
    if (canvas) {
      const enforceWhiteBackground = () => {
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
      };
      
      // Set white background immediately
      enforceWhiteBackground();
      
      // Also set it after a short delay to make sure it's applied
      const timeoutId = setTimeout(enforceWhiteBackground, 100);
      
      // Ensure drawing brush is properly configured
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = penColor;
        canvas.freeDrawingBrush.width = brushSize;
        // Ensure stroke is visible
        canvas.freeDrawingBrush.shadow = null;
        canvas.freeDrawingBrush.strokeLineCap = 'round';
        canvas.freeDrawingBrush.strokeLineJoin = 'round';
      }
      
      return () => clearTimeout(timeoutId);
    }
  }, [canvas, penColor, brushSize]);

  // Additional effect to monitor drawing mode changes
  useEffect(() => {
    if (canvas) {
      canvas.isDrawingMode = isDrawMode;
      canvas.renderAll();
    }
  }, [canvas, isDrawMode]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="bg-white">
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
            handleAddDateField={handleAddDateField}
            handleAddCheckbox={handleAddCheckbox}
          />
          
          <CanvasContainer canvasRef={canvasContainerRef} />
          
          {/* Quick access toolbar below the canvas */}
          <QuickToolbar
            isDrawMode={isDrawMode}
            toggleDrawMode={toggleDrawMode}
            clearCanvas={clearCanvas}
            handleUndo={handleUndo}
            handleRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            handleAddShape={handleAddShape}
            handleAddText={handleAddText}
            penColor={penColor}
            handleColorChange={handleColorChange}
            brushSize={brushSize}
            handleBrushSizeChange={handleBrushSizeChange}
            triggerUpload={triggerUpload}
            saveCanvas={saveCanvas}
            isLoading={isLoading}
            // Template props
            type={type}
            availableTemplates={availableTemplates}
            handleApplyTemplate={handleApplyTemplate}
            doctorName={doctorName}
            setDoctorName={setDoctorName}
            // Add new functionality
            handleAddDateField={handleAddDateField}
            handleAddCheckbox={handleAddCheckbox}
            handleExport={handleExport}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CanvasSection;
