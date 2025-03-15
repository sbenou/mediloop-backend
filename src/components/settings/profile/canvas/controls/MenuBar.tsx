
import React, { useState } from 'react';
import { 
  Menubar, 
  MenubarMenu, 
  MenubarTrigger, 
  MenubarContent
} from "@/components/ui/menubar";
import FileMenu from './menuComponents/FileMenu';
import EditMenu from './menuComponents/EditMenu';
import DrawMenu from './menuComponents/DrawMenu';
import InsertMenu from './menuComponents/InsertMenu';
import TemplatesMenu from './menuComponents/TemplatesMenu';
import AdvancedMenu from './menuComponents/AdvancedMenu';
import HelpMenu from './menuComponents/HelpMenu';
import { StampTemplate } from '../utils';

interface MenuBarProps {
  // Drawing tools
  isDrawMode: boolean;
  toggleDrawMode: () => void;
  clearCanvas: () => void;
  penColor: string;
  brushSize: number;
  handleColorChange: (color: string) => void;
  handleBrushSizeChange: (size: number) => void;
  
  // History
  handleUndo: () => void;
  handleRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Grid
  handleToggleGrid: () => void;
  showGrid: boolean;
  
  // Shapes
  handleAddShape: (shape: 'circle' | 'rectangle' | 'line') => void;
  handleAddText: () => void;
  handleRotate: (angle: number) => void;
  selectedTool: string;
  selectedShape: 'circle' | 'rectangle' | 'line' | null;
  
  // Upload
  triggerUpload: () => void;
  
  // Type specific
  type: 'stamp' | 'signature';
  
  // Templates - only for stamps
  availableTemplates?: StampTemplate[];
  handleApplyTemplate?: (templateId: string, doctorName?: string) => void;
  
  // Advanced
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
  
  // Export
  handleExport?: (format: 'png' | 'jpeg' | 'svg' | 'pdf') => string | Blob | null;
  
  // New props
  handleAddDateField?: () => void;
  handleAddCheckbox?: (checked: boolean) => void;
}

const MenuBar: React.FC<MenuBarProps> = (props) => {
  const [doctorName, setDoctorName] = useState("");
  
  return (
    <Menubar className="border-none shadow-sm bg-gray-50 rounded-md p-1">
      {/* File Menu */}
      <MenubarMenu>
        <MenubarTrigger className="font-medium">File</MenubarTrigger>
        <MenubarContent>
          <FileMenu 
            clearCanvas={props.clearCanvas}
            triggerUpload={props.triggerUpload}
            handleExport={props.handleExport}
          />
        </MenubarContent>
      </MenubarMenu>

      {/* Edit Menu */}
      <MenubarMenu>
        <MenubarTrigger className="font-medium">Edit</MenubarTrigger>
        <MenubarContent>
          <EditMenu 
            handleUndo={props.handleUndo}
            handleRedo={props.handleRedo}
            canUndo={props.canUndo}
            canRedo={props.canRedo}
            handleToggleGrid={props.handleToggleGrid}
            showGrid={props.showGrid}
          />
        </MenubarContent>
      </MenubarMenu>

      {/* Draw Menu */}
      <MenubarMenu>
        <MenubarTrigger className="font-medium">Draw</MenubarTrigger>
        <MenubarContent>
          <DrawMenu 
            isDrawMode={props.isDrawMode}
            toggleDrawMode={props.toggleDrawMode}
            brushSize={props.brushSize}
            handleBrushSizeChange={props.handleBrushSizeChange}
            penColor={props.penColor}
            handleColorChange={props.handleColorChange}
          />
        </MenubarContent>
      </MenubarMenu>

      {/* Insert Menu */}
      <MenubarMenu>
        <MenubarTrigger className="font-medium">Insert</MenubarTrigger>
        <MenubarContent>
          <InsertMenu 
            handleAddShape={props.handleAddShape}
            handleAddText={props.handleAddText}
            handleAddDateField={props.handleAddDateField}
            handleAddCheckbox={props.handleAddCheckbox}
          />
        </MenubarContent>
      </MenubarMenu>

      {/* Templates Menu - only for stamps */}
      {props.type === 'stamp' && props.availableTemplates && props.handleApplyTemplate && (
        <MenubarMenu>
          <MenubarTrigger className="font-medium">Templates</MenubarTrigger>
          <MenubarContent>
            <TemplatesMenu 
              doctorName={doctorName}
              setDoctorName={setDoctorName}
              availableTemplates={props.availableTemplates}
              handleApplyTemplate={props.handleApplyTemplate}
            />
          </MenubarContent>
        </MenubarMenu>
      )}

      {/* Advanced Menu */}
      <MenubarMenu>
        <MenubarTrigger className="font-medium">Advanced</MenubarTrigger>
        <MenubarContent>
          <AdvancedMenu 
            handleBringForward={props.handleBringForward}
            handleSendBackward={props.handleSendBackward}
            handleBringToFront={props.handleBringToFront}
            handleSendToBack={props.handleSendToBack}
            handleRotate={props.handleRotate}
          />
        </MenubarContent>
      </MenubarMenu>

      {/* Help Menu */}
      <MenubarMenu>
        <MenubarTrigger className="font-medium">Help</MenubarTrigger>
        <MenubarContent>
          <HelpMenu />
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};

export default MenuBar;
