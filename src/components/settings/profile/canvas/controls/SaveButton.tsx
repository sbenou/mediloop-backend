
import React from 'react';
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SaveButtonProps {
  saveCanvas: () => void;
  isLoading: boolean;
  type: 'stamp' | 'signature';
}

const SaveButton: React.FC<SaveButtonProps> = ({ saveCanvas, isLoading, type }) => {
  return (
    <Button
      onClick={saveCanvas}
      size="sm"
      className="col-span-2"
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="animate-spin h-4 w-4 mr-2" />
      ) : (
        <Save className="h-4 w-4 mr-2" />
      )}
      Save {type === 'stamp' ? 'Stamp' : 'Signature'}
    </Button>
  );
};

export default SaveButton;
