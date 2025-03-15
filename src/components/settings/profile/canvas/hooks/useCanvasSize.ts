
import { Canvas as FabricCanvas } from 'fabric';
import { resizeCanvas as resizeCanvasUtil } from '../utils';

export interface UseCanvasSizeProps {
  canvas: FabricCanvas | null;
}

export const useCanvasSize = ({ canvas }: UseCanvasSizeProps) => {
  // Canvas resizing
  const handleResizeCanvas = (width: number, height: number) => {
    if (canvas) {
      resizeCanvasUtil(canvas, width, height);
    }
  };

  return {
    handleResizeCanvas
  };
};
