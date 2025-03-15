
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Pencil, Save, Trash2, Upload } from "lucide-react";
import { Canvas as FabricCanvas } from "fabric";

interface CanvasControlsProps {
  isDrawMode: boolean;
  toggleDrawMode: () => void;
  clearCanvas: () => void;
  triggerUpload: () => void;
  saveCanvas: () => void;
  isLoading: boolean;
  penColor: string;
  handleColorChange: (color: string) => void;
  type: 'stamp' | 'signature';
}

const CanvasControls: React.FC<CanvasControlsProps> = ({
  isDrawMode,
  toggleDrawMode,
  clearCanvas,
  triggerUpload,
  saveCanvas,
  isLoading,
  penColor,
  handleColorChange,
  type
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <div className="text-sm">Pen color:</div>
        <input 
          type="color" 
          value={penColor} 
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-8 h-8 rounded-md border border-gray-300"
        />
        <button 
          onClick={() => handleColorChange('#000000')}
          className={`w-8 h-8 rounded-md ${penColor === '#000000' ? 'ring-2 ring-primary' : 'border border-gray-300'}`}
          style={{ backgroundColor: '#000000' }}
        />
        <button 
          onClick={() => handleColorChange('#0000FF')}
          className={`w-8 h-8 rounded-md ${penColor === '#0000FF' ? 'ring-2 ring-primary' : 'border border-gray-300'}`}
          style={{ backgroundColor: '#0000FF' }}
        />
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={isDrawMode ? "default" : "outline"} 
          size="sm"
          onClick={toggleDrawMode}
        >
          <Pencil className="h-4 w-4 mr-2" />
          {isDrawMode ? "Finish Drawing" : `Draw ${type === 'stamp' ? 'Stamp' : 'Signature'}`}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={triggerUpload}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Image
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={clearCanvas}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
        
        <Button
          onClick={saveCanvas}
          size="sm"
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
    </div>
  );
};

export default CanvasControls;
