
import { Canvas, PencilBrush } from 'fabric';

/**
 * Creates or updates a drawing brush on a Fabric.js canvas
 * Compatible with both Fabric.js v5 and v6
 */
export const createOrUpdateBrush = (
  canvas: Canvas,
  options: {
    color: string;
    width: number;
  }
) => {
  if (!canvas) return null;
  
  try {
    const { color, width } = options;
    
    // Create a new brush instance
    const brush = new PencilBrush(canvas);
    brush.color = color;
    brush.width = width;
    brush.shadow = null;
    brush.strokeLineCap = 'round';
    brush.strokeLineJoin = 'round';
    
    // In Fabric.js v6, use setBrush method
    if (typeof canvas.setBrush === 'function') {
      canvas.setBrush(brush);
      console.log("Brush set using canvas.setBrush()");
    } else {
      // Fallback for backward compatibility with v5
      (canvas as any).freeDrawingBrush = brush;
      console.log("Brush set using canvas.freeDrawingBrush fallback");
    }
    
    return brush;
  } catch (error) {
    console.error("Error creating/updating brush:", error);
    return null;
  }
};

/**
 * Gets the current brush from a Fabric.js canvas
 * Compatible with both Fabric.js v5 and v6
 */
export const getBrush = (canvas: Canvas): PencilBrush | null => {
  if (!canvas) return null;
  
  try {
    // Fabric.js v6 approach
    if (typeof canvas.getBrush === 'function') {
      return canvas.getBrush();
    }
    
    // Fallback for v5
    return (canvas as any).freeDrawingBrush || null;
  } catch (error) {
    console.error("Error getting brush:", error);
    return null;
  }
};
