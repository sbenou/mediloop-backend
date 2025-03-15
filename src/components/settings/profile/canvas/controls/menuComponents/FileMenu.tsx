
import React from 'react';
import { MenubarItem, MenubarSeparator } from "@/components/ui/menubar";
import { CircleOff, Image, Download } from "lucide-react";

interface FileMenuProps {
  clearCanvas: () => void;
  triggerUpload: () => void;
  handleExport?: (format: 'png' | 'jpeg' | 'svg' | 'pdf') => string | Blob | null;
}

const FileMenu: React.FC<FileMenuProps> = ({ clearCanvas, triggerUpload, handleExport }) => {
  return (
    <>
      <MenubarItem onClick={clearCanvas}>
        <CircleOff className="mr-2 h-4 w-4" />
        Clear Canvas
      </MenubarItem>
      <MenubarItem onClick={triggerUpload}>
        <Image className="mr-2 h-4 w-4" />
        Import Image
      </MenubarItem>
      <MenubarSeparator />
      {handleExport && (
        <>
          <MenubarItem onClick={() => handleExport('png')}>
            <Download className="mr-2 h-4 w-4" />
            Export as PNG
          </MenubarItem>
          <MenubarItem onClick={() => handleExport('jpeg')}>
            <Download className="mr-2 h-4 w-4" />
            Export as JPEG
          </MenubarItem>
          <MenubarItem onClick={() => handleExport('svg')}>
            <Download className="mr-2 h-4 w-4" />
            Export as SVG
          </MenubarItem>
          <MenubarItem onClick={() => handleExport('pdf')}>
            <Download className="mr-2 h-4 w-4" />
            Export as PDF
          </MenubarItem>
        </>
      )}
    </>
  );
};

export default FileMenu;
