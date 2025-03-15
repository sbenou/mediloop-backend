
import React, { useState } from 'react';
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BrushSizeControlProps {
  brushSize: number;
  handleBrushSizeChange: (size: number) => void;
}

const BrushSizeControl: React.FC<BrushSizeControlProps> = ({ brushSize, handleBrushSizeChange }) => {
  const [showBrushSizeSlider, setShowBrushSizeSlider] = useState(false);

  return (
    <TooltipProvider>
      <div className="relative">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={showBrushSizeSlider ? "bg-accent" : ""}
              onClick={() => setShowBrushSizeSlider(!showBrushSizeSlider)}
            >
              <span className="w-2 h-2 bg-foreground rounded-full mr-1"></span>
              <span className="text-xs">{brushSize}px</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Brush Size</TooltipContent>
        </Tooltip>
        
        {showBrushSizeSlider && (
          <div className="absolute mt-1 p-3 bg-background border rounded-md shadow-md w-40 z-50">
            <div className="flex items-center gap-2">
              <Minus className="h-3 w-3 text-muted-foreground" />
              <Slider
                value={[brushSize]}
                min={1}
                max={20}
                step={1}
                onValueChange={(value) => handleBrushSizeChange(value[0])}
                className="flex-1"
              />
              <Plus className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default BrushSizeControl;
