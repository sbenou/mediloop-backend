
import { useRef, useState, useEffect } from 'react';
import { Canvas as FabricCanvas, PencilBrush } from 'fabric';

interface UseCanvasInitializationProps {
  imageUrl: string | null;
}

export const useCanvasInitialization = ({ imageUrl }: UseCanvasInitializationProps) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const canvasCreated = useRef(false);

  useEffect(() => {
    if (!canvasContainerRef.current || canvasCreated.current) return;

    const canvasEl = document.createElement('canvas');
    canvasEl.id = 'canvas';
    canvasContainerRef.current.appendChild(canvasEl);

    const canvasInstance = new FabricCanvas(canvasEl, {
      backgroundColor: '#ffffff',
      width: canvasContainerRef.current.clientWidth || 500,
      height: 300,
      isDrawingMode: true,
      selection: false,
      renderOnAddRemove: true
    });

    // Initialize brush
    canvasInstance.freeDrawingBrush = new PencilBrush(canvasInstance);
    canvasInstance.freeDrawingBrush.width = 3;
    canvasInstance.freeDrawingBrush.color = '#000000';

    // Explicitly render to apply white background
    canvasInstance.setBackgroundColor('#ffffff', () => {
      canvasInstance.renderAll();
    });

    setCanvas(canvasInstance);
    canvasCreated.current = true;

    return () => {
      canvasInstance.dispose();
      canvasCreated.current = false;
    };
  }, []);

  useEffect(() => {
    if (!canvas || !imageUrl) return;

    canvas.clear();
    canvas.setBackgroundColor('#ffffff', () => {
      canvas.renderAll();
    });

    fabric.Image.fromURL(imageUrl, (img) => {
      const canvasAspect = canvas.width! / canvas.height!;
      const imgAspect = img.width! / img.height!;

      let scaleFactor = (canvas.width! * 0.9) / img.width!;
      if (imgAspect <= canvasAspect) {
        scaleFactor = (canvas.height! * 0.9) / img.height!;
      }

      img.scale(scaleFactor);
      img.set({
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false
      });

      canvas.add(img);
      canvas.renderAll();
    }, { crossOrigin: 'anonymous' });
  }, [canvas, imageUrl]);

  return {
    canvasContainerRef,
    canvas
  };
};
