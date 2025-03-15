
import React from 'react';
import { Minimize, Maximize, ArrowUp, MoveUp, MoveDown, ArrowDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface AdvancedTabProps {
  canvasWidth: number;
  canvasHeight: number;
  canvasWidthInput: string;
  canvasHeightInput: string;
  handleWidthChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleHeightChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  applyCanvasResize: () => void;
  handleResizeCanvas?: (width: number, height: number) => void;
  handleBringForward?: () => void;
  handleSendBackward?: () => void;
  handleBringToFront?: () => void;
  handleSendToBack?: () => void;
  selectedImage?: any;
  filterOptions?: {
    brightness: number;
    contrast: number;
    grayscale: boolean;
    sepia: boolean;
  };
  handleApplyFilter?: (filterType: 'brightness' | 'contrast' | 'grayscale' | 'sepia', value: number) => void;
}

const AdvancedTab: React.FC<AdvancedTabProps> = ({
  canvasWidthInput,
  canvasHeightInput,
  handleWidthChange,
  handleHeightChange,
  applyCanvasResize,
  handleResizeCanvas,
  handleBringForward,
  handleSendBackward,
  handleBringToFront,
  handleSendToBack,
  selectedImage,
  filterOptions = { brightness: 0, contrast: 0, grayscale: false, sepia: false },
  handleApplyFilter
}) => {
  return (
    <div className="space-y-4">
      {/* Canvas Size Controls */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Canvas Size</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="canvas-width">Width</Label>
            <div className="flex">
              <Input
                id="canvas-width"
                type="number"
                min="50"
                max="1000"
                value={canvasWidthInput}
                onChange={handleWidthChange}
              />
              <span className="ml-1 self-center text-sm text-muted-foreground">px</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="canvas-height">Height</Label>
            <div className="flex">
              <Input
                id="canvas-height"
                type="number"
                min="50"
                max="1000"
                value={canvasHeightInput}
                onChange={handleHeightChange}
              />
              <span className="ml-1 self-center text-sm text-muted-foreground">px</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={applyCanvasResize} 
            className="flex-1"
          >
            Apply Size
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleResizeCanvas?.(320, 200)}
            className="flex-none"
          >
            <Minimize className="h-3 w-3 mr-1" />
            Small
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleResizeCanvas?.(450, 280)}
            className="flex-none"
          >
            <Maximize className="h-3 w-3 mr-1" />
            Large
          </Button>
        </div>
      </div>
      
      <Separator />
      
      {/* Layer Controls */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Layers</h4>
        <div className="grid grid-cols-4 gap-2">
          <Button size="sm" onClick={handleBringToFront} disabled={!handleBringToFront}>
            <ArrowUp className="h-4 w-4 mr-1" />
            Front
          </Button>
          <Button size="sm" onClick={handleBringForward} disabled={!handleBringForward}>
            <MoveUp className="h-4 w-4 mr-1" />
            Forward
          </Button>
          <Button size="sm" onClick={handleSendBackward} disabled={!handleSendBackward}>
            <MoveDown className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button size="sm" onClick={handleSendToBack} disabled={!handleSendToBack}>
            <ArrowDown className="h-4 w-4 mr-1" />
            Bottom
          </Button>
        </div>
      </div>
      
      <Separator />
      
      {/* Image Filters - Only shown when an image is selected */}
      {selectedImage && handleApplyFilter && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Image Filters
          </h4>
          
          <div className="space-y-4">
            {/* Brightness */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label htmlFor="brightness">Brightness</Label>
                <span className="text-xs text-muted-foreground">
                  {Math.round(filterOptions.brightness * 100)}%
                </span>
              </div>
              <Slider
                id="brightness"
                min={-1}
                max={1}
                step={0.05}
                value={[filterOptions.brightness]}
                onValueChange={(value) => handleApplyFilter('brightness', value[0])}
              />
            </div>
            
            {/* Contrast */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label htmlFor="contrast">Contrast</Label>
                <span className="text-xs text-muted-foreground">
                  {Math.round((filterOptions.contrast + 1) * 50)}%
                </span>
              </div>
              <Slider
                id="contrast"
                min={-1}
                max={1}
                step={0.05}
                value={[filterOptions.contrast]}
                onValueChange={(value) => handleApplyFilter('contrast', value[0])}
              />
            </div>
            
            {/* Grayscale & Sepia toggles */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="grayscale"
                  checked={filterOptions.grayscale}
                  onCheckedChange={(checked) => 
                    handleApplyFilter('grayscale', checked ? 1 : 0)
                  }
                />
                <Label htmlFor="grayscale">Grayscale</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="sepia"
                  checked={filterOptions.sepia}
                  onCheckedChange={(checked) => 
                    handleApplyFilter('sepia', checked ? 1 : 0)
                  }
                />
                <Label htmlFor="sepia">Sepia</Label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedTab;
