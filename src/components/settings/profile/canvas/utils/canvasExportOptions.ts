
import { Canvas as FabricCanvas } from "fabric";

// Export canvas to different formats
export const exportCanvas = (canvas: FabricCanvas, format: 'png' | 'jpeg' | 'svg' | 'pdf'): string | Blob | null => {
  if (!canvas) return null;
  
  // Ensure white background before exporting
  canvas.backgroundColor = '#ffffff';
  canvas.renderAll();
  
  switch (format) {
    case 'png':
      return canvas.toDataURL({ 
        format: 'png',
        quality: 1,
        multiplier: 1 
      });
    case 'jpeg':
      return canvas.toDataURL({ 
        format: 'jpeg',
        quality: 0.9,
        multiplier: 1 
      });
    case 'svg':
      const svgData = canvas.toSVG();
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      return blob;
    case 'pdf':
      // Simple PDF generation using canvas data URL
      // For production use, consider using a library like jsPDF
      const dataUrl = canvas.toDataURL({ 
        format: 'png',
        quality: 1,
        multiplier: 1 
      });
      
      // Create a link to download
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'stamp-or-signature.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      return dataUrl;
    default:
      return null;
  }
};
