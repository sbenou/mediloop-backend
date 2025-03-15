
import React from 'react';
import { Pencil, Circle, Square, Type, Minus as LineIcon, CalendarDays, CheckSquare } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  return (
    <ToggleGroup type="single" className="justify-start flex-wrap">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem 
              value="draw" 
              aria-label="Toggle drawing mode"
              data-state={isDrawMode ? "on" : "off"}
              onClick={toggleDrawMode}
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
              data-state={selectedTool === 'shape' && selectedShape === 'circle' ? "on" : "off"}
              onClick={() => handleAddShape('circle')}
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
              data-state={selectedTool === 'shape' && selectedShape === 'rectangle' ? "on" : "off"}
              onClick={() => handleAddShape('rectangle')}
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
              data-state={selectedTool === 'shape' && selectedShape === 'line' ? "on" : "off"}
              onClick={() => handleAddShape('line')}
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
              data-state={selectedTool === 'text' ? "on" : "off"}
              onClick={handleAddText}
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
                data-state={selectedTool === 'date' ? "on" : "off"}
                onClick={handleAddDateField}
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
                data-state={selectedTool === 'checkbox' ? "on" : "off"}
                onClick={() => handleAddCheckbox(false)}
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
