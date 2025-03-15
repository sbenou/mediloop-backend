
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
          <ToolsTab {...props} />
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
