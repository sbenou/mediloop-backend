
import { useRef, useState, useEffect } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Image as FabricImage } from 'fabric';

interface UseCanvasInitializationProps {
  imageUrl: string | null;
}

export const useCanvasInitialization = ({ imageUrl }: UseCanvasInitializationProps) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<FabricCanvas | null>(null);
  const [canvasWidth, setCanvasWidth] = useState<number>(500);
  const [canvasHeight, setCanvasHeight] = useState<number>(300);
  const canvasCreated = useRef(false);

  useEffect(() => {
    if (!canvasContainerRef.current || canvasCreated.current) return;

    const canvasEl = document.createElement('canvas');
    canvasEl.id = 'canvas';
    canvasContainerRef.current.appendChild(canvasEl);

    const width = canvasContainerRef.current.clientWidth || 500;
    const height = 300;

    setCanvasWidth(width);
    setCanvasHeight(height);

    const canvasInstance = new FabricCanvas(canvasEl, {
      backgroundColor: '#ffffff',
      width: width,
      height: height,
      isDrawingMode: true,
      selection: true,
      renderOnAddRemove: true
    });

    // Initialize brush properly
    canvasInstance.freeDrawingBrush = new PencilBrush(canvasInstance);
    canvasInstance.freeDrawingBrush.width = 3; 
    canvasInstance.freeDrawingBrush.color = '#000000';

    // Explicitly set background color and render
    canvasInstance.backgroundColor = '#ffffff';
    canvasInstance.defaultCursor = 'crosshair';
    canvasInstance.renderAll();

    console.log('Canvas initialized with dimensions:', width, 'x', height);
    setCanvas(canvasInstance);
    canvasCreated.current = true;

    return () => {
      canvasInstance.dispose();
      canvasCreated.current = false;
    };
  }, []);

  useEffect(() => {
    if (!canvas || !imageUrl) return;

    console.log('Loading image URL to canvas:', imageUrl);
    
    // Using the correct Fabric.js v6 API
    FabricImage.fromURL(imageUrl, {
      crossOrigin: 'anonymous',
    }).then(img => {
      console.log('Image loaded successfully:', img.width, 'x', img.height);
      
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

      // Re-establish white background
      canvas.backgroundColor = '#ffffff';
      
      // FIX: Correctly add the image at the bottom layer
      console.log('Adding image to canvas');
      canvas.add(img);
      canvas.sendObjectToBack(img); // Use correct method for Fabric.js v6
      
      // Additional verification to make sure image stays at back
      setTimeout(() => {
        canvas.sendObjectToBack(img);
        console.log('Canvas objects after image added:', canvas.getObjects().length);
        canvas.renderAll();
      }, 100);
      
      canvas.renderAll();
    }).catch(err => {
      console.error("Error loading image:", err);
    });
  }, [canvas, imageUrl]);

  return {
    canvasContainerRef,
    canvas,
    canvasWidth,
    canvasHeight
  };
};
