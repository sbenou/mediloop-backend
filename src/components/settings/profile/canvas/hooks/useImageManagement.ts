
import { useState, useEffect } from 'react';
import { Canvas as FabricCanvas, Image as FabricImage } from 'fabric';
import { 
  applyImageFilter as applyImageFilterUtil,
  exportCanvas as exportCanvasUtil
} from '../utils';

export interface UseImageManagementProps {
  canvas: FabricCanvas | null;
}

export const useImageManagement = ({ canvas }: UseImageManagementProps) => {
  const [selectedImage, setSelectedImage] = useState<FabricImage | null>(null);
  const [filterOptions, setFilterOptions] = useState({
    brightness: 0,
    contrast: 0,
    grayscale: false,
    sepia: false
  });

  // Track selected image on the canvas
  useEffect(() => {
    if (!canvas) return;
    
    const handleSelectionCreated = (e: any) => {
      const selectedObject = e.selected?.[0];
      if (selectedObject && selectedObject.type === 'image') {
        setSelectedImage(selectedObject as FabricImage);
      } else {
        setSelectedImage(null);
      }
    };
    
    const handleSelectionCleared = () => {
      setSelectedImage(null);
    };
    
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionCreated);
    canvas.on('selection:cleared', handleSelectionCleared);
    
    return () => {
      canvas.off('selection:created', handleSelectionCreated);
      canvas.off('selection:updated', handleSelectionCreated);
      canvas.off('selection:cleared', handleSelectionCleared);
    };
  }, [canvas]);

  // Apply image filter
  const handleApplyFilter = (filterType: 'brightness' | 'contrast' | 'grayscale' | 'sepia', value: number) => {
    if (!canvas || !selectedImage) return;
    
    applyImageFilterUtil(canvas, selectedImage, filterType, value);
    
    // Update filter options state
    setFilterOptions(prev => ({
      ...prev,
      [filterType]: filterType === 'grayscale' || filterType === 'sepia' ? true : value
    }));
  };

  // Export to different formats
  const handleExport = (format: 'png' | 'jpeg' | 'svg' | 'pdf') => {
    if (canvas) {
      return exportCanvasUtil(canvas, format);
    }
    return null;
  };

  return {
    selectedImage,
    filterOptions,
    handleApplyFilter,
    handleExport
  };
};
