
import { useRef } from 'react';
import { Canvas as FabricCanvas } from 'fabric';
import { loadImageToCanvas } from '../utils';

export const useFileUpload = (canvas: FabricCanvas | null) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && canvas) {
      // Ensure white background before processing
      canvas.backgroundColor = '#ffffff';
      canvas.renderAll();
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && canvas) {
          const imgUrl = event.target.result.toString();
          loadImageToCanvas(canvas, imgUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return {
    fileInputRef,
    triggerUpload,
    handleFileChange
  };
};
