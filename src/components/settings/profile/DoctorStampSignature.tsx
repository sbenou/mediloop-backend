
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/auth/useAuth";
import { Upload, Check, X, Trash, Undo, Circle, Edit } from "lucide-react";
// Import fabric properly for TypeScript
import { Canvas, PencilBrush } from "fabric";

export default function DoctorStampSignature({ stampUrl, signatureUrl }: { stampUrl: string | null, signatureUrl: string | null }) {
  const { profile } = useAuth();
  const [isEditingStamp, setIsEditingStamp] = useState(false);
  const [isEditingSignature, setIsEditingSignature] = useState(false);
  const [isUploadingStamp, setIsUploadingStamp] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000"); // Default black color
  
  const stampCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stampFabricRef = useRef<Canvas | null>(null);
  const signatureFabricRef = useRef<Canvas | null>(null);

  useEffect(() => {
    return () => {
      // Clean up on unmount
      if (stampFabricRef.current) {
        stampFabricRef.current.dispose();
      }
      if (signatureFabricRef.current) {
        signatureFabricRef.current.dispose();
      }
    };
  }, []);

  const initCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>, fabricRef: React.MutableRefObject<Canvas | null>) => {
    if (canvasRef.current && !fabricRef.current) {
      console.log("Initializing canvas with drawing mode");
      const canvas = new Canvas(canvasRef.current, {
        isDrawingMode: true,
        width: 300,
        height: 200,
        backgroundColor: '#f8f9fa'
      });
      
      // Explicitly set to drawing mode with pencil brush
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.width = 3;
      canvas.freeDrawingBrush.color = selectedColor;
      
      // Log setup for debugging
      console.log(`Canvas initialized. Drawing mode: ${canvas.isDrawingMode}, Brush color: ${canvas.freeDrawingBrush.color}`);
      
      fabricRef.current = canvas;
    }
  };

  const updateBrushColor = (color: string) => {
    setSelectedColor(color);
    
    // Update active canvas brush color
    if (isEditingStamp && stampFabricRef.current) {
      stampFabricRef.current.freeDrawingBrush.color = color;
      console.log(`Updated stamp brush color to ${color}`);
    }
    
    if (isEditingSignature && signatureFabricRef.current) {
      signatureFabricRef.current.freeDrawingBrush.color = color;
      console.log(`Updated signature brush color to ${color}`);
    }
  };

  useEffect(() => {
    if (isEditingStamp) {
      setTimeout(() => {
        initCanvas(stampCanvasRef, stampFabricRef);
      }, 100);
    }
  }, [isEditingStamp]);

  useEffect(() => {
    if (isEditingSignature) {
      setTimeout(() => {
        initCanvas(signatureCanvasRef, signatureFabricRef);
      }, 100);
    }
  }, [isEditingSignature]);

  // Update brush color when color changes
  useEffect(() => {
    if (stampFabricRef.current && stampFabricRef.current.isDrawingMode) {
      stampFabricRef.current.freeDrawingBrush.color = selectedColor;
    }
    if (signatureFabricRef.current && signatureFabricRef.current.isDrawingMode) {
      signatureFabricRef.current.freeDrawingBrush.color = selectedColor;
    }
  }, [selectedColor]);

  const clearCanvas = (fabricRef: React.MutableRefObject<Canvas | null>) => {
    if (fabricRef.current) {
      fabricRef.current.clear();
      fabricRef.current.setBackgroundColor('#f8f9fa', fabricRef.current.renderAll.bind(fabricRef.current));
    }
  };

  const undoLastAction = (fabricRef: React.MutableRefObject<Canvas | null>) => {
    if (fabricRef.current) {
      const objects = fabricRef.current.getObjects();
      if (objects.length > 0) {
        fabricRef.current.remove(objects[objects.length - 1]);
      }
    }
  };

  const saveCanvasAsImage = async (
    fabricRef: React.MutableRefObject<Canvas | null>,
    type: 'stamp' | 'signature'
  ) => {
    if (!profile?.id || !fabricRef.current) return;

    const setUploadingState = type === 'stamp'
      ? setIsUploadingStamp
      : setIsUploadingSignature;

    const setEditingState = type === 'stamp'
      ? setIsEditingStamp
      : setIsEditingSignature;

    try {
      setUploadingState(true);

      // Convert canvas to data URL
      const dataUrl = fabricRef.current.toDataURL({
        format: 'png',
        quality: 1
      });

      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      // Create file from blob
      const file = new File([blob], `${type}_${Date.now()}.png`, { type: 'image/png' });

      // Generate a unique file path
      const filePath = `${profile.id}/${type}_${crypto.randomUUID()}.png`;

      // Upload to Supabase storage
      const { error: uploadError, data } = await supabase.storage
        .from('doctor-images')
        .upload(filePath, file, {
          upsert: true,
          contentType: 'image/png'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('doctor-images')
        .getPublicUrl(filePath);

      // Update profile with URL
      const updateData = type === 'stamp'
        ? { doctor_stamp_url: publicUrl }
        : { doctor_signature_url: publicUrl };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `Doctor ${type} updated successfully`,
      });

      setEditingState(false);
    } catch (error) {
      console.error(`Error saving ${type}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update ${type}`,
      });
    } finally {
      setUploadingState(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Doctor Stamp</CardTitle>
          <CardDescription>
            Your professional stamp to use on prescriptions and official documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditingStamp ? (
            <div className="space-y-4">
              <div className="border rounded-md p-4 bg-gray-50">
                <canvas ref={stampCanvasRef} width="300" height="200" />
              </div>
              
              <div className="flex space-x-2 mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Color:</span>
                  <button 
                    className={`w-6 h-6 rounded-full border ${selectedColor === '#000000' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`} 
                    style={{ backgroundColor: '#000000' }} 
                    onClick={() => updateBrushColor('#000000')}
                  />
                  <button 
                    className={`w-6 h-6 rounded-full border ${selectedColor === '#0000FF' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`} 
                    style={{ backgroundColor: '#0000FF' }} 
                    onClick={() => updateBrushColor('#0000FF')}
                  />
                  <button 
                    className={`w-6 h-6 rounded-full border ${selectedColor === '#FF0000' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`} 
                    style={{ backgroundColor: '#FF0000' }} 
                    onClick={() => updateBrushColor('#FF0000')}
                  />
                </div>
              </div>
              
              <div className="flex justify-between">
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => clearCanvas(stampFabricRef)}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => undoLastAction(stampFabricRef)}
                  >
                    <Undo className="h-4 w-4 mr-1" />
                    Undo
                  </Button>
                </div>
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingStamp(false)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => saveCanvasAsImage(stampFabricRef, 'stamp')}
                    disabled={isUploadingStamp}
                  >
                    {isUploadingStamp ? (
                      <>
                        <Circle className="h-4 w-4 mr-1 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Save Stamp
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 border rounded-md">
              {stampUrl || profile?.doctor_stamp_url ? (
                <div className="text-center">
                  <img
                    src={stampUrl || profile?.doctor_stamp_url}
                    alt="Doctor Stamp"
                    className="max-h-32 mx-auto mb-4"
                  />
                  <Button onClick={() => setIsEditingStamp(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Stamp
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    You haven't created a stamp yet
                  </p>
                  <Button onClick={() => setIsEditingStamp(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Create Stamp
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Doctor Signature</CardTitle>
          <CardDescription>
            Your digital signature for prescriptions and medical documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditingSignature ? (
            <div className="space-y-4">
              <div className="border rounded-md p-4 bg-gray-50">
                <canvas ref={signatureCanvasRef} width="300" height="200" />
              </div>
              
              <div className="flex space-x-2 mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Color:</span>
                  <button 
                    className={`w-6 h-6 rounded-full border ${selectedColor === '#000000' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`} 
                    style={{ backgroundColor: '#000000' }} 
                    onClick={() => updateBrushColor('#000000')}
                  />
                  <button 
                    className={`w-6 h-6 rounded-full border ${selectedColor === '#0000FF' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`} 
                    style={{ backgroundColor: '#0000FF' }} 
                    onClick={() => updateBrushColor('#0000FF')}
                  />
                  <button 
                    className={`w-6 h-6 rounded-full border ${selectedColor === '#FF0000' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`} 
                    style={{ backgroundColor: '#FF0000' }} 
                    onClick={() => updateBrushColor('#FF0000')}
                  />
                </div>
              </div>
              
              <div className="flex justify-between">
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => clearCanvas(signatureFabricRef)}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => undoLastAction(signatureFabricRef)}
                  >
                    <Undo className="h-4 w-4 mr-1" />
                    Undo
                  </Button>
                </div>
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingSignature(false)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => saveCanvasAsImage(signatureFabricRef, 'signature')}
                    disabled={isUploadingSignature}
                  >
                    {isUploadingSignature ? (
                      <>
                        <Circle className="h-4 w-4 mr-1 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Save Signature
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 border rounded-md">
              {signatureUrl || profile?.doctor_signature_url ? (
                <div className="text-center">
                  <img
                    src={signatureUrl || profile?.doctor_signature_url}
                    alt="Doctor Signature"
                    className="max-h-32 mx-auto mb-4"
                  />
                  <Button onClick={() => setIsEditingSignature(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Signature
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    You haven't created a signature yet
                  </p>
                  <Button onClick={() => setIsEditingSignature(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Create Signature
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
