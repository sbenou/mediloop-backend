
import { Canvas as FabricCanvas, Circle, Rect, Text, Line } from "fabric";
import { saveCanvasState } from "./canvasHistory";

// Templates for stamps and signatures
export interface StampTemplate {
  id: string;
  name: string;
  applyTemplate: (canvas: FabricCanvas, doctorName?: string) => void;
  thumbnail: string;
}

// Predefined templates
export const stampTemplates: StampTemplate[] = [
  {
    id: 'circular',
    name: 'Circular Stamp',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgc3Ryb2tlPSIjMDAwIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSI1MCIgeT0iNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj5ET0NUT1I8L3RleHQ+PC9zdmc+',
    applyTemplate: (canvas, doctorName) => {
      canvas.clear();
      
      // Outer circle
      const outerCircle = new Circle({
        radius: Math.min(canvas.getWidth(), canvas.getHeight()) * 0.4,
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2,
        originX: 'center',
        originY: 'center',
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 2
      });
      
      // Inner circle
      const innerCircle = new Circle({
        radius: Math.min(canvas.getWidth(), canvas.getHeight()) * 0.35,
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2,
        originX: 'center',
        originY: 'center',
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 1
      });
      
      // Text for doctor name
      const nameText = new Text(doctorName || 'Dr. Name', {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2 - 15,
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#000000',
        originX: 'center',
        originY: 'center'
      });
      
      // Text for "M.D."
      const designationText = new Text('M.D.', {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2 + 15,
        fontSize: 12,
        fill: '#000000',
        originX: 'center',
        originY: 'center'
      });
      
      canvas.add(outerCircle);
      canvas.add(innerCircle);
      canvas.add(nameText);
      canvas.add(designationText);
      canvas.renderAll();
      saveCanvasState(canvas);
    }
  },
  {
    id: 'rectangular',
    name: 'Rectangular Stamp',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIxMCIgeT0iMjAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI2MCIgc3Ryb2tlPSIjMDAwIiBmaWxsPSJub25lIiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSI1MCIgeT0iNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj5ET0NUT1I8L3RleHQ+PC9zdmc+',
    applyTemplate: (canvas, doctorName) => {
      canvas.clear();
      
      // Rectangle
      const rect = new Rect({
        width: canvas.getWidth() * 0.8,
        height: canvas.getHeight() * 0.6,
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2,
        originX: 'center',
        originY: 'center',
        fill: 'transparent',
        stroke: '#000000',
        strokeWidth: 2
      });
      
      // Line separator
      const line = new Line([
        canvas.getWidth() * 0.2, 
        canvas.getHeight() / 2,
        canvas.getWidth() * 0.8, 
        canvas.getHeight() / 2
      ], {
        stroke: '#000000',
        strokeWidth: 1
      });
      
      // Text for doctor name
      const nameText = new Text(doctorName || 'Dr. Name', {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2 - 20,
        fontSize: 16,
        fontWeight: 'bold',
        fill: '#000000',
        originX: 'center',
        originY: 'center'
      });
      
      // Text for license
      const licenseText = new Text('License #: 12345', {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2 + 20,
        fontSize: 12,
        fill: '#000000',
        originX: 'center',
        originY: 'center'
      });
      
      canvas.add(rect);
      canvas.add(line);
      canvas.add(nameText);
      canvas.add(licenseText);
      canvas.renderAll();
      saveCanvasState(canvas);
    }
  },
  {
    id: 'signature',
    name: 'Signature Template',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjUwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMCwyNSBDMjAsMTAgNDAsMTAgNTAsMjUgQzYwLDQwIDgwLDQwIDkwLDI1IiBzdHJva2U9IiMwMDAiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==',
    applyTemplate: (canvas, doctorName) => {
      canvas.clear();
      
      // Signature line
      const line = new Line([
        canvas.getWidth() * 0.2, 
        canvas.getHeight() * 0.7,
        canvas.getWidth() * 0.8, 
        canvas.getHeight() * 0.7
      ], {
        stroke: '#000000',
        strokeWidth: 1
      });
      
      // Text for doctor name
      const nameText = new Text(doctorName || 'Dr. Name', {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() * 0.85,
        fontSize: 14,
        fontWeight: 'bold',
        fill: '#000000',
        originX: 'center',
        originY: 'center'
      });
      
      canvas.add(line);
      canvas.add(nameText);
      canvas.renderAll();
      saveCanvasState(canvas);
    }
  }
];
