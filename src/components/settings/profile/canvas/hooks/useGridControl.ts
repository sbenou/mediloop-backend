
import { useState, useEffect } from 'react';
import { Canvas } from 'fabric';
import { toggleGrid as toggleGridUtil } from '../utils';

export interface UseGridControlProps {
  canvas: Canvas | null;
}

export const useGridControl = ({ canvas }: UseGridControlProps) => {
  const [showGrid, setShowGrid] = useState(false);

  // Update grid when toggle changes
  useEffect(() => {
    if (canvas) {
      toggleGridUtil(canvas, showGrid);
    }
  }, [canvas, showGrid]);

  // Toggle grid visibility
  const handleToggleGrid = () => {
    setShowGrid(!showGrid);
  };

  return {
    showGrid,
    handleToggleGrid
  };
};
