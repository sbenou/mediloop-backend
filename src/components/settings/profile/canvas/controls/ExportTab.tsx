
import React from 'react';
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportTabProps {
  handleExport?: (format: 'png' | 'jpeg' | 'svg' | 'pdf') => string | Blob | null;
}

const ExportTab: React.FC<ExportTabProps> = ({ handleExport }) => {
  const exportToFormat = (format: 'png' | 'jpeg' | 'svg' | 'pdf') => {
    if (handleExport) {
      handleExport(format);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => exportToFormat('png')} disabled={!handleExport}>
          <Download className="h-4 w-4 mr-2" />
          PNG
        </Button>
        <Button onClick={() => exportToFormat('jpeg')} disabled={!handleExport}>
          <Download className="h-4 w-4 mr-2" />
          JPEG
        </Button>
        <Button onClick={() => exportToFormat('svg')} disabled={!handleExport}>
          <Download className="h-4 w-4 mr-2" />
          SVG
        </Button>
        <Button onClick={() => exportToFormat('pdf')} disabled={!handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Download As Image
        </Button>
      </div>
    </div>
  );
};

export default ExportTab;
