
import React from 'react';
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuickToolbarProps } from './QuickToolbar';

type ExportTabProps = Pick<Required<QuickToolbarProps>, 'handleExport'>;

const ExportTab: React.FC<ExportTabProps> = ({ handleExport }) => {
  return (
    <div className="p-3">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => handleExport('png')}>
            <Download className="h-4 w-4 mr-2" />
            PNG
          </Button>
          <Button onClick={() => handleExport('jpeg')}>
            <Download className="h-4 w-4 mr-2" />
            JPEG
          </Button>
          <Button onClick={() => handleExport('svg')}>
            <Download className="h-4 w-4 mr-2" />
            SVG
          </Button>
          <Button onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportTab;
