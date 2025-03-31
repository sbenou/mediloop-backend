
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ToolsTab from './ToolsTab';
import DrawingTab from './DrawingTab';
import TemplatesTab from './TemplatesTab';
import ExportTab from './ExportTab';
import { StampTemplate } from '../../utils';

export interface QuickToolbarProps {
  isDrawMode: boolean;
  toggleDrawMode: () => void;
  clearCanvas: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  handleAddShape: (shape: 'circle' | 'rectangle' | 'line') => void;
  handleAddText: () => void;
  penColor: string;
  handleColorChange: (color: string) => void;
  brushSize: number;
  handleBrushSizeChange: (size: number) => void;
  triggerUpload: () => void;
  saveCanvas: () => void;
  isLoading: boolean;
  // Tool selection states
  selectedTool: string;
  selectedShape: 'circle' | 'rectangle' | 'line' | null;
  // Tool state setters
  setSelectedTool: (tool: 'draw' | 'select' | 'shape' | 'text' | 'date' | 'checkbox') => void;
  setSelectedShape: (shape: 'circle' | 'rectangle' | 'line' | null) => void;
  setIsDrawMode: (isDrawMode: boolean) => void;
  // Template props
  type?: 'stamp' | 'signature';
  availableTemplates?: StampTemplate[];
  handleApplyTemplate?: (templateId: string, doctorName?: string) => void;
  doctorName?: string;
  setDoctorName?: (name: string) => void;
  // New props for additional functionality
  handleAddDateField?: () => void;
  handleAddCheckbox?: (checked: boolean) => void;
  handleExport?: (format: 'png' | 'jpeg' | 'svg' | 'pdf') => string | Blob | null;
}

const QuickToolbar: React.FC<QuickToolbarProps> = (props) => {
  // Define which tabs to show based on props
  const showTemplates = (props.type === 'stamp' || props.type === 'signature') && 
                        props.availableTemplates && 
                        props.handleApplyTemplate;

  const showExport = !!props.handleExport;

  // Get tabs based on type and available functionality
  const getTabList = () => {
    const tabs = [
      <TabsTrigger key="tools" value="tools" className="flex-1">Basic Tools</TabsTrigger>,
      <TabsTrigger key="draw" value="draw" className="flex-1">Drawing</TabsTrigger>
    ];

    if (showTemplates) {
      tabs.push(<TabsTrigger key="templates" value="templates" className="flex-1">Templates</TabsTrigger>);
    }

    if (showExport) {
      tabs.push(<TabsTrigger key="export" value="export" className="flex-1">Export</TabsTrigger>);
    }

    return tabs;
  };

  return (
    <div className="rounded-md border bg-card">
      <Tabs defaultValue="tools">
        <TabsList className="w-full border-b rounded-none">
          {getTabList()}
        </TabsList>
        
        <TabsContent value="tools">
          <ToolsTab 
            isDrawMode={props.isDrawMode}
            toggleDrawMode={props.toggleDrawMode}
            clearCanvas={props.clearCanvas}
            handleUndo={props.handleUndo}
            handleRedo={props.handleRedo}
            canUndo={props.canUndo}
            canRedo={props.canRedo}
            handleAddShape={props.handleAddShape}
            handleAddText={props.handleAddText}
            triggerUpload={props.triggerUpload}
            saveCanvas={props.saveCanvas}
            isLoading={props.isLoading}
            handleAddDateField={props.handleAddDateField}
            handleAddCheckbox={props.handleAddCheckbox}
            selectedTool={props.selectedTool}
            selectedShape={props.selectedShape}
            setSelectedTool={props.setSelectedTool}
            setIsDrawMode={props.setIsDrawMode}
          />
        </TabsContent>
        
        <TabsContent value="draw">
          <DrawingTab 
            penColor={props.penColor}
            handleColorChange={props.handleColorChange}
            brushSize={props.brushSize}
            handleBrushSizeChange={props.handleBrushSizeChange}
          />
        </TabsContent>
        
        {showTemplates && (
          <TabsContent value="templates">
            <TemplatesTab 
              type={props.type}
              availableTemplates={props.availableTemplates}
              handleApplyTemplate={props.handleApplyTemplate}
              doctorName={props.doctorName}
              setDoctorName={props.setDoctorName}
            />
          </TabsContent>
        )}
        
        {showExport && (
          <TabsContent value="export">
            <ExportTab handleExport={props.handleExport} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default QuickToolbar;
