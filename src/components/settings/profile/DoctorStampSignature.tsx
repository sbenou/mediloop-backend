
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/auth/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Save, Trash2, Upload } from "lucide-react";
import { fabric } from 'fabric';

interface DoctorStampSignatureProps {
  stampUrl: string | null;
  signatureUrl: string | null;
}

const DoctorStampSignature: React.FC<DoctorStampSignatureProps> = ({ stampUrl, signatureUrl }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Canvas references
  const stampCanvasContainerRef = useRef<HTMLDivElement>(null);
  const signatureCanvasContainerRef = useRef<HTMLDivElement>(null);
  
  // Fabric canvas states
  const [stampCanvas, setStampCanvas] = useState<fabric.Canvas | null>(null);
  const [signatureCanvas, setSignatureCanvas] = useState<fabric.Canvas | null>(null);
  
  // UI states
  const [isStampDrawMode, setIsStampDrawMode] = useState(false);
  const [isSignatureDrawMode, setIsSignatureDrawMode] = useState(false);
  const [isLoadingStamp, setIsLoadingStamp] = useState(false);
  const [isLoadingSignature, setIsLoadingSignature] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  
  // File input references
  const stampFileInputRef = useRef<HTMLInputElement>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);

  // Initialize canvases on component mount
  useEffect(() => {
    // Initialize stamp canvas
    if (stampCanvasContainerRef.current && !stampCanvas) {
      const canvas = initializeCanvas(stampCanvasContainerRef.current);
      setStampCanvas(canvas);
    }
    
    // Initialize signature canvas
    if (signatureCanvasContainerRef.current && !signatureCanvas) {
      const canvas = initializeCanvas(signatureCanvasContainerRef.current);
      setSignatureCanvas(canvas);
    }
    
    // Cleanup on unmount
    return () => {
      if (stampCanvas) stampCanvas.dispose();
      if (signatureCanvas) signatureCanvas.dispose();
    };
  }, []);
  
  // Initialize a fabric canvas
  const initializeCanvas = (container: HTMLDivElement): fabric.Canvas => {
    // Create a canvas element
    const canvasElement = document.createElement('canvas');
    container.innerHTML = ''; // Clear any existing content
    container.appendChild(canvasElement);
    
    // Set canvas dimensions to match container
    canvasElement.width = container.clientWidth;
    canvasElement.height = container.clientHeight;
    
    // Initialize fabric canvas
    const canvas = new fabric.Canvas(canvasElement, {
      backgroundColor: '#ffffff',
      isDrawingMode: false,
    });
    
    // Set up drawing brush
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = penColor;
    canvas.freeDrawingBrush.width = 3;
    
    return canvas;
  };
  
  // Load existing stamp and signature URLs if available
  useEffect(() => {
    if (stampCanvas && stampUrl) {
      loadImageToCanvas(stampCanvas, stampUrl);
    }
    
    if (signatureCanvas && signatureUrl) {
      loadImageToCanvas(signatureCanvas, signatureUrl);
    }
  }, [stampCanvas, signatureCanvas, stampUrl, signatureUrl]);
  
  // Load an image to a canvas
  const loadImageToCanvas = (canvas: fabric.Canvas, url: string) => {
    fabric.Image.fromURL(url, (img) => {
      canvas.clear();
      
      // Scale image to fit canvas while maintaining aspect ratio
      const canvasWidth = canvas.getWidth() || 290;
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
  
  // Toggle stamp drawing mode
  const toggleStampDrawMode = () => {
    if (!stampCanvas) return;
    
    const newMode = !isStampDrawMode;
    setIsStampDrawMode(newMode);
    
    stampCanvas.isDrawingMode = newMode;
    if (newMode) {
      stampCanvas.freeDrawingBrush.color = penColor;
      stampCanvas.freeDrawingBrush.width = 3;
    }
  };
  
  // Toggle signature drawing mode
  const toggleSignatureDrawMode = () => {
    if (!signatureCanvas) return;
    
    const newMode = !isSignatureDrawMode;
    setIsSignatureDrawMode(newMode);
    
    signatureCanvas.isDrawingMode = newMode;
    if (newMode) {
      signatureCanvas.freeDrawingBrush.color = penColor;
      signatureCanvas.freeDrawingBrush.width = 2;
    }
  };
  
  // Clear the stamp canvas
  const clearStampCanvas = () => {
    if (stampCanvas) {
      stampCanvas.clear();
      stampCanvas.backgroundColor = '#ffffff';
      stampCanvas.renderAll();
    }
  };
  
  // Clear the signature canvas
  const clearSignatureCanvas = () => {
    if (signatureCanvas) {
      signatureCanvas.clear();
      signatureCanvas.backgroundColor = '#ffffff';
      signatureCanvas.renderAll();
    }
  };
  
  // Trigger stamp file upload dialog
  const uploadStampImage = () => {
    if (stampFileInputRef.current) {
      stampFileInputRef.current.click();
    }
  };
  
  // Trigger signature file upload dialog
  const uploadSignatureImage = () => {
    if (signatureFileInputRef.current) {
      signatureFileInputRef.current.click();
    }
  };
  
  // Handle stamp file selection
  const handleStampFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && stampCanvas) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const imgUrl = event.target.result.toString();
          fabric.Image.fromURL(imgUrl, (img) => {
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
  
  // Handle signature file selection
  const handleSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && signatureCanvas) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const imgUrl = event.target.result.toString();
          fabric.Image.fromURL(imgUrl, (img) => {
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
  
  // Save stamp to Supabase storage
  const saveStamp = async () => {
    if (!stampCanvas || !profile?.id) return;
    
    setIsLoadingStamp(true);
    try {
      console.log('Starting stamp save process...');
      
      // Convert canvas to data URL
      const dataUrl = stampCanvas.toDataURL({
        format: 'png',
        quality: 1
      });
      
      console.log('Stamp canvas converted to data URL');
      
      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      console.log(`Stamp blob created: ${blob.size} bytes, type: ${blob.type}`);
      
      // Upload to Supabase storage
      const filePath = `stamps/${profile.id}/${Date.now()}.png`;
      console.log(`Preparing to upload stamp to: ${filePath}`);
      
      // Ensure the bucket exists
      try {
        const { error: bucketError } = await supabase.storage.getBucket('doctor-images');
        if (bucketError) {
          console.log('Error getting bucket:', bucketError);
          if (bucketError.message.includes('not found')) {
            console.log('Bucket not found, creating it...');
            const { error: createBucketError } = await supabase.storage.createBucket('doctor-images', {
              public: true,
              fileSizeLimit: 5242880, // 5MB
              allowedMimeTypes: ['image/png', 'image/jpeg']
            });
            
            if (createBucketError) {
              console.error('Error creating bucket:', createBucketError);
              throw createBucketError;
            }
            console.log('Bucket created successfully');
          } else {
            throw bucketError;
          }
        }
      } catch (error) {
        console.error('Bucket error check failed:', error);
        // Continue with upload attempt even if bucket check fails
      }
      
      const { error: uploadError } = await supabase.storage
        .from('doctor-images')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Error uploading stamp:', uploadError);
        throw uploadError;
      }
      
      console.log('Stamp uploaded successfully, getting public URL');
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('doctor-images')
        .getPublicUrl(filePath);
      
      console.log(`Public URL obtained: ${urlData.publicUrl}`);
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ doctor_stamp_url: urlData.publicUrl })
        .eq('id', profile.id);
      
      if (updateError) {
        console.error('Error updating profile with stamp URL:', updateError);
        throw updateError;
      }
      
      console.log('Profile updated with new stamp URL');
      
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
  
  // Save signature to Supabase storage
  const saveSignature = async () => {
    if (!signatureCanvas || !profile?.id) return;
    
    setIsLoadingSignature(true);
    try {
      console.log('Starting signature save process...');
      
      // Convert canvas to data URL
      const dataUrl = signatureCanvas.toDataURL({
        format: 'png',
        quality: 1
      });
      
      console.log('Signature canvas converted to data URL');
      
      // Convert data URL to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      console.log(`Signature blob created: ${blob.size} bytes, type: ${blob.type}`);
      
      // Upload to Supabase storage
      const filePath = `signatures/${profile.id}/${Date.now()}.png`;
      console.log(`Preparing to upload signature to: ${filePath}`);
      
      // Ensure the bucket exists (reusing the same bucket)
      try {
        const { error: bucketError } = await supabase.storage.getBucket('doctor-images');
        if (bucketError && bucketError.message.includes('not found')) {
          console.log('Bucket not found, creating it...');
          const { error: createBucketError } = await supabase.storage.createBucket('doctor-images', {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/png', 'image/jpeg']
          });
          
          if (createBucketError) {
            console.error('Error creating bucket:', createBucketError);
            throw createBucketError;
          }
          console.log('Bucket created successfully');
        }
      } catch (error) {
        console.error('Bucket error check failed:', error);
        // Continue with upload attempt even if bucket check fails
      }
      
      const { error: uploadError } = await supabase.storage
        .from('doctor-images')
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Error uploading signature:', uploadError);
        throw uploadError;
      }
      
      console.log('Signature uploaded successfully, getting public URL');
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('doctor-images')
        .getPublicUrl(filePath);
      
      console.log(`Public URL obtained: ${urlData.publicUrl}`);
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ doctor_signature_url: urlData.publicUrl })
        .eq('id', profile.id);
      
      if (updateError) {
        console.error('Error updating profile with signature URL:', updateError);
        throw updateError;
      }
      
      console.log('Profile updated with new signature URL');
      
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
  
  // Update pen color for both drawing contexts
  const handleColorChange = (color: string) => {
    setPenColor(color);
    if (stampCanvas && stampCanvas.isDrawingMode) {
      stampCanvas.freeDrawingBrush.color = color;
    }
    if (signatureCanvas && signatureCanvas.isDrawingMode) {
      signatureCanvas.freeDrawingBrush.color = color;
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
            <div 
              ref={stampCanvasContainerRef}
              className="border rounded-md overflow-hidden bg-white w-full" 
              style={{ height: '200px' }}
            ></div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="text-sm">Pen color:</div>
                <input 
                  type="color" 
                  value={penColor} 
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 rounded-md border border-gray-300"
                />
                <button 
                  onClick={() => handleColorChange('#000000')}
                  className={`w-8 h-8 rounded-md ${penColor === '#000000' ? 'ring-2 ring-primary' : 'border border-gray-300'}`}
                  style={{ backgroundColor: '#000000' }}
                />
                <button 
                  onClick={() => handleColorChange('#0000FF')}
                  className={`w-8 h-8 rounded-md ${penColor === '#0000FF' ? 'ring-2 ring-primary' : 'border border-gray-300'}`}
                  style={{ backgroundColor: '#0000FF' }}
                />
              </div>
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
            <div 
              ref={signatureCanvasContainerRef}
              className="border rounded-md overflow-hidden bg-white w-full" 
              style={{ height: '200px' }}
            ></div>
            
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
