
// Templates for stamps and signatures

import { Canvas, Circle, IText, Rect } from "fabric";

export interface StampTemplate {
  id: string;
  name: string;
  thumbnail?: string;
  type: 'stamp' | 'signature';
  renderTemplate: (canvas: Canvas, name?: string) => void;
}

export const stampTemplates: StampTemplate[] = [
  {
    id: 'round-stamp',
    name: 'Round Stamp',
    type: 'stamp',
    renderTemplate: (canvas: Canvas, name = 'Dr. Name') => {
      // Clear canvas first
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      
      // Create outer circle
      const outerCircle = new Circle({
        radius: 80,
        fill: 'transparent',
        stroke: '#000',
        strokeWidth: 2,
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center'
      });
      
      // Create inner circle
      const innerCircle = new Circle({
        radius: 70,
        fill: 'transparent',
        stroke: '#000',
        strokeWidth: 1,
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center'
      });
      
      // Add text for name at the top
      const nameText = new IText(name, {
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 'bold',
        left: canvas.width! / 2,
        top: canvas.height! / 2 - 40,
        originX: 'center',
        originY: 'center',
        textAlign: 'center'
      });
      
      // Add Doctor text at the bottom
      const doctorText = new IText('Medical Doctor', {
        fontFamily: 'Arial',
        fontSize: 14,
        left: canvas.width! / 2,
        top: canvas.height! / 2 + 40,
        originX: 'center',
        originY: 'center',
        textAlign: 'center'
      });
      
      // Add license number
      const licenseText = new IText('License #12345', {
        fontFamily: 'Arial',
        fontSize: 12,
        left: canvas.width! / 2,
        top: canvas.height! / 2 + 10,
        originX: 'center',
        originY: 'center',
        textAlign: 'center'
      });
      
      // Add them to canvas
      canvas.add(outerCircle);
      canvas.add(innerCircle);
      canvas.add(nameText);
      canvas.add(doctorText);
      canvas.add(licenseText);
      
      // Render
      canvas.renderAll();
    }
  },
  {
    id: 'square-stamp',
    name: 'Square Stamp',
    type: 'stamp',
    renderTemplate: (canvas: Canvas, name = 'Dr. Name') => {
      // Clear canvas first
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      
      // Create outer square
      const outerSquare = new Rect({
        width: 160,
        height: 160,
        fill: 'transparent',
        stroke: '#000',
        strokeWidth: 2,
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center'
      });
      
      // Create inner square
      const innerSquare = new Rect({
        width: 140,
        height: 140,
        fill: 'transparent',
        stroke: '#000',
        strokeWidth: 1,
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center'
      });
      
      // Add text for name at the top
      const nameText = new IText(name, {
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 'bold',
        left: canvas.width! / 2,
        top: canvas.height! / 2 - 40,
        originX: 'center',
        originY: 'center',
        textAlign: 'center'
      });
      
      // Add Doctor text at the bottom
      const doctorText = new IText('Pharmacist', {
        fontFamily: 'Arial',
        fontSize: 14,
        left: canvas.width! / 2,
        top: canvas.height! / 2 + 40,
        originX: 'center',
        originY: 'center',
        textAlign: 'center'
      });
      
      // Add license number
      const licenseText = new IText('License #12345', {
        fontFamily: 'Arial',
        fontSize: 12,
        left: canvas.width! / 2,
        top: canvas.height! / 2 + 10,
        originX: 'center',
        originY: 'center',
        textAlign: 'center'
      });
      
      // Add them to canvas
      canvas.add(outerSquare);
      canvas.add(innerSquare);
      canvas.add(nameText);
      canvas.add(doctorText);
      canvas.add(licenseText);
      
      // Render
      canvas.renderAll();
    }
  },
  {
    id: 'signature-template',
    name: 'Cursive Signature',
    type: 'signature',
    renderTemplate: (canvas: Canvas, name = 'John Doe') => {
      // Clear canvas first
      canvas.clear();
      canvas.backgroundColor = '#ffffff';
      
      // Add text for signature
      const signatureText = new IText(name, {
        fontFamily: 'Brush Script MT',
        fontSize: 36,
        fontStyle: 'italic',
        left: canvas.width! / 2,
        top: canvas.height! / 2,
        originX: 'center',
        originY: 'center',
        textAlign: 'center'
      });
      
      // Add a line underneath
      const underline = new Rect({
        width: signatureText.width! + 20,
        height: 2,
        fill: '#000',
        left: canvas.width! / 2,
        top: canvas.height! / 2 + 25,
        originX: 'center',
        originY: 'center'
      });
      
      // Add them to canvas
      canvas.add(signatureText);
      canvas.add(underline);
      
      // Render
      canvas.renderAll();
    }
  }
];
