import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/auth/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Canvas as FabricCanvas } from "fabric/fabric-impl";
import { Pencil, Save, Trash2, Upload } from "lucide-react";
import * as fabric from 'fabric';

interface DoctorStampSignatureProps {
  stampUrl: string | null;
  signatureUrl: string | null;
}

const DoctorStampSignature: React.FC<DoctorStampSignatureProps> = ({ stampUrl, signatureUrl }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const stampCanvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [stampCanvas, setStampCanvas] = useState<fabric.Canvas | null>(null);
  const [signatureCanvas, setSignatureCanvas] = useState<fabric.Canvas | null>(null);
  
  const [isStampDrawMode, setIsStampDrawMode] = useState(false);
  const [isSignatureDrawMode, setIsSignatureDrawMode] = useState(false);
  
  const [isLoadingStamp, setIsLoadingStamp] = useState(false);
  const [isLoadingSignature, setIsLoadingSignature] = useState(false);
  
  const stampFileInputRef = useRef<HTMLInputElement>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);

  // Initialize canvases
  useEffect(() => {
    if (stampCanvasRef.current && !stampCanvas) {
      const canvas = new fabric.Canvas(stampCanvasRef.current, {
        backgroundColor: '#ffffff',
        width: 300,
        height: 200,
        isDrawingMode: false
      });
      
      setStampCanvas(canvas);
    }
    
    if (signatureCanvasRef.current && !signatureCanvas) {
      const canvas = new fabric.Canvas(signatureCanvasRef.current, {
        backgroundColor: '#ffffff',
        width: 300,
        height: 200,
        isDrawingMode: false
      });
      
      setSignatureCanvas(canvas);
    }
    
    return () => {
      stampCanvas?.dispose();
      signatureCanvas?.dispose();
    };
  }, []);
  
  // Load existing stamp and signature if available
  useEffect(() => {
    if (stampCanvas && stampUrl) {
      loadImageToCanvas(stampCanvas, stampUrl);
    }
    
    if (signatureCanvas && signatureUrl) {
      loadImageToCanvas(signatureCanvas, signatureUrl);
    }
  }, [stampCanvas, signatureCanvas, stampUrl, signatureUrl]);
  
  const loadImageToCanvas = (canvas: fabric.Canvas, url: string) => {
    fabric.Image.fromURL(url, (img) => {
      canvas.clear();
      
      // Scale image to fit canvas while maintaining aspect ratio
      const canvasWidth = canvas.getWidth() || 300;
      const canvasHeight = canvas.getHeight() || 200;
      
      const imgWidth = img.width || 100;
      const imgHeight = img.height || 100;
      
      const scale = Math.min(
        canvasWidth / imgWidth,
        canvasHeight / imgHeight
      );
      
      img.scale(scale);
      
      // Center the image on the canvas
      img.set({
        left: (canvasWidth - (imgWidth * scale)) / 2,
        top: (canvasHeight - (imgHeight * scale)) / 2
      });
      
      canvas.add(img);
      canvas.renderAll();
    });
  };
  
  const toggleStampDrawMode = () => {
    if (!stampCanvas) return;
    
    const newMode = !isStampDrawMode;
    setIsStampDrawMode(newMode);
    
    stampCanvas.isDrawingMode = newMode;
    if (newMode) {
      stampCanvas.freeDrawingBrush.color = '#000000';
      stampCanvas.freeDrawingBrush.width = 3;
    }
  };
  
  const toggleSignatureDrawMode = () => {
    if (!signatureCanvas) return;
    
    const newMode = !isSignatureDrawMode;
    setIsSignatureDrawMode(newMode);
    
    signatureCanvas.isDrawingMode = newMode;
    if (newMode) {
      signatureCanvas.freeDrawingBrush.color = '#000000';
      signatureCanvas.freeDrawingBrush.width = 2;
    }
  };
  
  const clearStampCanvas = () => {
    if (stampCanvas) {
      stampCanvas.clear();
      stampCanvas.backgroundColor = '#ffffff';
      stampCanvas.renderAll();
    }
  };
  
  const clearSignatureCanvas = () => {
    if (signatureCanvas) {
      signatureCanvas.clear();
      signatureCanvas.backgroundColor = '#ffffff';
      signatureCanvas.renderAll();
    }
  };
  
  const uploadStampImage = () => {
    if (stampFileInputRef.current) {
      stampFileInputRef.current.click();
    }
  };
  
  const uploadSignatureImage = () => {
    if (signatureFileInputRef.current) {
      signatureFileInputRef.current.click();
    }
  };
  
  const handleStampFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && stampCanvas) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          fabric.Image.fromURL(event.target.result.toString(), (img) => {
            stampCanvas.clear();
            
            // Scale image to fit canvas
            const scale = Math.min(
              stampCanvas.getWidth()! / (img.width || 100),
              stampCanvas.getHeight()! / (img.height || 100)
            );
            
            img.scale(scale);
            
            // Center the image
            img.set({
              left: (stampCanvas.getWidth()! - ((img.width || 100) * scale)) / 2,
              top: (stampCanvas.getHeight()! - ((img.height || 100) * scale)) / 2
            });
            
            stampCanvas.add(img);
            stampCanvas.renderAll();
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && signatureCanvas) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          fabric.Image.fromURL(event.target.result.toString(), (img) => {
            signatureCanvas.clear();
            
            // Scale image to fit canvas
            const scale = Math.min(
              signatureCanvas.getWidth()! / (img.width || 100),
              signatureCanvas.getHeight()! / (img.height || 100)
            );
            
            img.scale(scale);
            
            // Center the image
            img.set({
              left: (signatureCanvas.getWidth()! - ((img.width || 100) * scale)) / 2,
              top: (signatureCanvas.getHeight()! - ((img.height || 100) * scale)) / 2
            });
            
            signatureCanvas.add(img);
            signatureCanvas.renderAll();
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const saveStamp = async () => {
    if (!stampCanvas || !profile?.id) return;
    
    setIsLoadingStamp(true);
    try {
      // Convert canvas to data URL
      const dataUrl = stampCanvas.toDataURL({
        format: 'png',
        quality: 1
      });
      
      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      // Upload to Supabase storage
      const filePath = `stamps/${profile.id}/${Date.now()}.png`;
      
      // Ensure the bucket exists
      const { error: bucketError } = await supabase.storage.getBucket('doctor-images');
      if (bucketError && bucketError.message.includes('not found')) {
        const { error: createBucketError } = await supabase.storage.createBucket('doctor-images', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/png', 'image/jpeg']
        });
        
        if (createBucketError) {
          throw createBucketError;
        }
      }
      
      const { error: uploadError } = await supabase.storage
        .from('doctor-images')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('doctor-images')
        .getPublicUrl(filePath);
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ doctor_stamp_url: data.publicUrl })
        .eq('id', profile.id);
      
      if (updateError) throw updateError;
      
      // Invalidate query cache
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      toast({
        title: "Success",
        description: "Doctor stamp uploaded successfully"
      });
    } catch (error: any) {
      console.error('Error saving stamp:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload stamp"
      });
    } finally {
      setIsLoadingStamp(false);
    }
  };
  
  const saveSignature = async () => {
    if (!signatureCanvas || !profile?.id) return;
    
    setIsLoadingSignature(true);
    try {
      // Convert canvas to data URL
      const dataUrl = signatureCanvas.toDataURL({
        format: 'png',
        quality: 1
      });
      
      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      // Upload to Supabase storage
      const filePath = `signatures/${profile.id}/${Date.now()}.png`;
      
      // Ensure the bucket exists
      const { error: bucketError } = await supabase.storage.getBucket('doctor-images');
      if (bucketError && bucketError.message.includes('not found')) {
        const { error: createBucketError } = await supabase.storage.createBucket('doctor-images', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/png', 'image/jpeg']
        });
        
        if (createBucketError) {
          throw createBucketError;
        }
      }
      
      const { error: uploadError } = await supabase.storage
        .from('doctor-images')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data } = supabase.storage
        .from('doctor-images')
        .getPublicUrl(filePath);
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ doctor_signature_url: data.publicUrl })
        .eq('id', profile.id);
      
      if (updateError) throw updateError;
      
      // Invalidate query cache
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      toast({
        title: "Success",
        description: "Doctor signature uploaded successfully"
      });
    } catch (error: any) {
      console.error('Error saving signature:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload signature"
      });
    } finally {
      setIsLoadingSignature(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={stampFileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleStampFileChange}
      />
      <input
        type="file"
        ref={signatureFileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleSignatureFileChange}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Doctor Stamp</CardTitle>
          <CardDescription>
            This stamp will appear on your prescriptions and official documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-md overflow-hidden bg-white" style={{ width: '300px', height: '200px' }}>
              <canvas ref={stampCanvasRef} />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={isStampDrawMode ? "default" : "outline"} 
                size="sm"
                onClick={toggleStampDrawMode}
              >
                <Pencil className="h-4 w-4 mr-2" />
                {isStampDrawMode ? "Finish Drawing" : "Draw Stamp"}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={uploadStampImage}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearStampCanvas}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
              
              <Button
                onClick={saveStamp}
                size="sm"
                disabled={isLoadingStamp}
              >
                {isLoadingStamp ? (
                  <span className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Stamp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Doctor Signature</CardTitle>
          <CardDescription>
            This signature will appear on your prescriptions and official documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-md overflow-hidden bg-white" style={{ width: '300px', height: '200px' }}>
              <canvas ref={signatureCanvasRef} />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={isSignatureDrawMode ? "default" : "outline"} 
                size="sm"
                onClick={toggleSignatureDrawMode}
              >
                <Pencil className="h-4 w-4 mr-2" />
                {isSignatureDrawMode ? "Finish Drawing" : "Draw Signature"}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={uploadSignatureImage}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearSignatureCanvas}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
              
              <Button
                onClick={saveSignature}
                size="sm"
                disabled={isLoadingSignature}
              >
                {isLoadingSignature ? (
                  <span className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Signature
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorStampSignature;
