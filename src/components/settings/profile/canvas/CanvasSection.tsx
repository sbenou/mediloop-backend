import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCanvasManager } from './useCanvasManager';
import CanvasControls from './CanvasControls';
import CanvasContainer from './components/CanvasContainer';
import { useFileUpload } from './hooks/useFileUpload';
import { useSaveCanvas } from './hooks/useSaveCanvas';
import QuickToolbar from './components/quicktoolbar';
import UnsavedChangesModal from './components/UnsavedChangesModal';
import useUnsavedNavigationWarning from './hooks/useUnsavedNavigationWarning';

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
  const [nextRoute, setNextRoute] = useState<string | null>(null);
  
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
    isDirty,
    selectedTool,
    selectedShape,
    toggleDrawMode,
    clearCanvas,
    handleColorChange,
    handleBrushSizeChange,
    handleUndo,
    handleRedo,
    resetHistory,
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
    handleAddCheckbox,
    showWarningToast,
    showWarningModal,
    showModal,
    handleSaveAndLeave,
    handleDiscardAndLeave,
    handleCancelNavigation,
    // State setters
    setSelectedTool,
    setSelectedShape,
    setIsDrawMode
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
      
      // Reset history and dirty state after saving
      resetHistory();
    }
  };

  // Custom navigation warning implementation
  const {
    showModal: showNavigationModal,
    handleSaveAndContinue,
    handleDismissAndContinue,
    handleCancelNavigation: cancelNavigation
  } = useUnsavedNavigationWarning({
    shouldBlock: isDirty,
    onSave: saveCanvas,
    onDismiss: resetHistory
  });

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
      
      // Set the cursor based on drawing mode
      if (isDrawMode) {
        const penCursor = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAFEmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNC0wMy0xOFQxMDo0MDoyMSswMDowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjQtMDMtMThUMTA6NDA6NDYrMDA6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDMtMThUMTA6NDA6NDYrMDA6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MWVlNTI3ZmEtNWU0Yi02NTQxLWIyMjUtNDJhNzMxYjg0YzFjIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjFlZTUyN2ZhLTVlNGItNjU0MS1iMjI1LTQyYTczMWI4NGMxYyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjFlZTUyN2ZhLTVlNGItNjU0MS1iMjI1LTQyYTczMWI4NGMxYyI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MWVlNTI3ZmEtNWU0Yi02NTQxLWIyMjUtNDJhNzMxYjg0YzFjIiBzdEV2dDp3aGVuPSIyMDI0LTAzLTE4VDEwOjQwOjIxKzAwOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PlmfX50AAAOASURBVFiFvZdNbBtFFMd/M7vrXX/E+diNE9cxqFVLVakqSAQKCJA4UCSEeqiqigMSHDhw4AYHJITghhDiA4lDJcSFFokDUksrWoRagsKhTUFtSIljO3HsJE68H157d4fDxHHiOA5JU56U1a5m3r//m/+892ZFNW+HGGKMASkQA4LdrwAyUOt+a8Ch1p4ppXbGACQgAWSBKUAFiO1NVXSN2K6SddxrlIBjwP4AQKnJFg4ZlbzZKpfPue3WnBfoQ4XDUlUUCdBUddKIRPYbsfiLeiS6ADwPnAe2DXkrcBKYHgQSQoQkRJHtnL7Z3Nxc6t10V+hn1XjskB6bcE3HIkkSpdVVufbvlS0sk9lIJKbTewdfVqPx81jWa7iuAdwAFoAa4AkgB5wCjg5YGwO07WazOVP45+IJ0/UeaJScRXPLLIQjhsKBoFhopJuXtW1xvLlnX8YY2NNZq12uLC9Xdu8+6MYmnr4pWytLvncMWO0Fegk4PYJhCngEkGR9vf2bYVTLk3v3HzcS4jcUDxmvHnrIl98tLrb9TnuZ3aSRB84Ac4A9CPTSkHD3fQvAUlWpIqQDsYxc9Q19/2P38JEDgdBejbW6bnY2G4X1f3+MZrMvCCVSeP/9izFgFjgJPA2oQQz0IdOdQoA3QY5qcliuKfH7BZBCoOshNR2+SwECo9GvDmDcM0H4Yd3SgMeHJFpnQdRSKeXlsdY+AuDZtlOpVIxlx9NvTB74/LXS5Lkvyf8SBE4DRbqXmVLhw1E56wGRRKLjBH7Ttm2ZTCbjx9PpzwqhaO6OuBZg0p3UYpTx7jwdIhIlkUir2WgYDjTn60r0jrvg3wvoFPDqqCMFiBCCeDJZXV0pJO1Wa+4iRnPvcfXHIL7jxUBm1HgPKBKJ1G3PnamiUNejM/fGH73lnFuH0IFXRh3vAWmaplUtYzqgU+P//EbANiKZbGmpmuMGQRDow4x3gdR2vXkoEXcbDhNW9bZZcBcKQX8rIwF5VNXLmGa96XnHYhPaT+fZuuPktYLhMdAzVVUbKyvL+0w9Mv/eOZkflbw+VDD0zQBFUer5fEGn0nrYq1b/HreM9dFnIAgCqlULOl79XW/l1rkV7GsB5XLFhWK1ZbYeeJ9eHpf8JnX36vG36/V6Bcu61fzdpv8HfwDWw9k6jVtqLAAAAABJRU5ErkJggg==) 4 4, auto';
        canvas.defaultCursor = penCursor;
        canvas.hoverCursor = penCursor;
        
        // Also apply cursor directly to DOM element
        const canvasEl = canvas.getElement();
        if (canvasEl) {
          canvasEl.style.cursor = penCursor;
        }
      } else {
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'default';
        
        // Also apply cursor directly to DOM element
        const canvasEl = canvas.getElement();
        if (canvasEl) {
          canvasEl.style.cursor = 'default';
        }
      }
      
      canvas.renderAll();
    }
  }, [canvas, isDrawMode]);

  // Add useEffect to expose canvas to window for debugging
  useEffect(() => {
    if (canvas) {
      // 👇 Expose the canvas to the browser console
      (window as any).fabricCanvas = canvas;
      console.log("✅ Canvas attached to window as fabricCanvas");
    }
  }, [canvas]);

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
            // Add missing required props
            selectedTool={selectedTool}
            selectedShape={selectedShape}
            setSelectedTool={setSelectedTool}
            setSelectedShape={setSelectedShape}
            setIsDrawMode={setIsDrawMode}
          />
        </div>
      </CardContent>
      
      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        open={showModal || showNavigationModal}
        onSaveAndLeave={handleSaveAndContinue}
        onDiscardAndLeave={handleDismissAndContinue}
        onCancel={cancelNavigation}
      />
    </Card>
  );
};

export default CanvasSection;
