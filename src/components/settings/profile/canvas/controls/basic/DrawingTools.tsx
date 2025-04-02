
import React from 'react';
import { Pencil, Circle, Square, Type, Minus as LineIcon, CalendarDays, CheckSquare } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils"; // Assuming cn is available for conditional classes

interface DrawingToolsProps {
  isDrawMode: boolean;
  toggleDrawMode: () => void;
  handleAddShape: (shape: 'circle' | 'rectangle' | 'line') => void;
  handleAddText: () => void;
  handleAddDateField?: () => void;
  handleAddCheckbox?: (checked: boolean) => void;
  selectedTool: string;
  selectedShape: 'circle' | 'rectangle' | 'line' | null;
}

const DrawingTools: React.FC<DrawingToolsProps> = ({
  isDrawMode,
  toggleDrawMode,
  handleAddShape,
  handleAddText,
  handleAddDateField,
  handleAddCheckbox,
  selectedTool,
  selectedShape
}) => {
  // Helper function to determine if a tool is active
  const isToolActive = (tool: string, shape?: string) => {
    if (tool === 'shape' && shape) {
      return selectedTool === 'shape' && selectedShape === shape;
    }
    return selectedTool === tool;
  };
  
  return (
    <ToggleGroup type="single" className="justify-start flex-wrap">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem 
              value="draw" 
              aria-label="Toggle drawing mode"
              data-state={isToolActive('draw') ? "on" : "off"}
              onClick={toggleDrawMode}
              className={cn({
                "bg-violet-100 text-violet-700 border-violet-200": isToolActive('draw'),
              })}
            >
              <Pencil className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isDrawMode ? "Finish Drawing" : "Draw"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem 
              value="circle" 
              aria-label="Add circle"
              data-state={isToolActive('shape', 'circle') ? "on" : "off"}
              onClick={() => handleAddShape('circle')}
              className={cn({
                "bg-violet-100 text-violet-700 border-violet-200": isToolActive('shape', 'circle'),
              })}
            >
              <Circle className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="bottom">Add Circle</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem 
              value="rectangle" 
              aria-label="Add rectangle"
              data-state={isToolActive('shape', 'rectangle') ? "on" : "off"}
              onClick={() => handleAddShape('rectangle')}
              className={cn({
                "bg-violet-100 text-violet-700 border-violet-200": isToolActive('shape', 'rectangle'),
              })}
            >
              <Square className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="bottom">Add Rectangle</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem 
              value="line" 
              aria-label="Add line"
              data-state={isToolActive('shape', 'line') ? "on" : "off"}
              onClick={() => handleAddShape('line')}
              className={cn({
                "bg-violet-100 text-violet-700 border-violet-200": isToolActive('shape', 'line'),
              })}
            >
              <LineIcon className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="bottom">Add Line</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem 
              value="text" 
              aria-label="Add text"
              data-state={isToolActive('text') ? "on" : "off"}
              onClick={handleAddText}
              className={cn({
                "bg-violet-100 text-violet-700 border-violet-200": isToolActive('text'),
              })}
            >
              <Type className="h-4 w-4" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent side="bottom">Add Text</TooltipContent>
        </Tooltip>

        {handleAddDateField && (
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem 
                value="date" 
                aria-label="Add date field"
                data-state={isToolActive('date') ? "on" : "off"}
                onClick={handleAddDateField}
                className={cn({
                  "bg-violet-100 text-violet-700 border-violet-200": isToolActive('date'),
                })}
              >
                <CalendarDays className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom">Add Date Field</TooltipContent>
          </Tooltip>
        )}

        {handleAddCheckbox && (
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem 
                value="checkbox" 
                aria-label="Add checkbox"
                data-state={isToolActive('checkbox') ? "on" : "off"}
                onClick={() => handleAddCheckbox(false)}
                className={cn({
                  "bg-violet-100 text-violet-700 border-violet-200": isToolActive('checkbox'),
                })}
              >
                <CheckSquare className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom">Add Checkbox</TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </ToggleGroup>
  );
};

export default DrawingTools;
