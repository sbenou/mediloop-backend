
import React from 'react';
import { Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GridToggleProps {
  showGrid: boolean;
  handleToggleGrid: () => void;
}

const GridToggle: React.FC<GridToggleProps> = ({ showGrid, handleToggleGrid }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={showGrid ? "default" : "outline"}
            size="sm"
            onClick={handleToggleGrid}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Toggle Grid</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default GridToggle;
