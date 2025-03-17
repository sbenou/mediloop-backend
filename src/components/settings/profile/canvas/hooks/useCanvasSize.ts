
import { Canvas as FabricCanvas } from 'fabric';
import { resizeCanvas } from '../utils/canvasShapes';

export interface UseCanvasSizeProps {
  canvas: FabricCanvas | null;
}

export const useCanvasSize = ({ canvas }: UseCanvasSizeProps) => {
  // Canvas resizing
  const handleResizeCanvas = (width: number, height: number) => {
    if (canvas) {
      resizeCanvas(canvas, width, height);
    }
  };

  return {
    handleResizeCanvas
  };
};
