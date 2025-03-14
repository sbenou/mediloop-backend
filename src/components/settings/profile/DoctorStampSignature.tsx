
import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Pencil, Save, Trash, Undo, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Canvas, Image as FabricImage } from "fabric";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface DoctorStampSignatureProps {
  stampUrl: string | null;
  signatureUrl: string | null;
}

export const DoctorStampSignature = ({ stampUrl, signatureUrl }: DoctorStampSignatureProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'stamp' | 'signature'>('stamp');
  const [drawMode, setDrawMode] = useState<'upload' | 'draw'>('upload');
  const [penColor, setPenColor] = useState<string>("#000000");
  const stampCanvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricStampCanvasRef = useRef<Canvas | null>(null);
  const fabricSignatureCanvasRef = useRef<Canvas | null>(null);
  const queryClient = useQueryClient();

  // Initialize fabric canvas
  useEffect(() => {
    if (stampCanvasRef.current && !fabricStampCanvasRef.current) {
      fabricStampCanvasRef.current = new Canvas(stampCanvasRef.current, {
        isDrawingMode: true,
        width: 300,
        height: 150,
        backgroundColor: '#f8f9fa'
      });
      
      if (fabricStampCanvasRef.current.freeDrawingBrush) {
        fabricStampCanvasRef.current.freeDrawingBrush.width = 3;
        fabricStampCanvasRef.current.freeDrawingBrush.color = penColor;
      }
    }

    if (signatureCanvasRef.current && !fabricSignatureCanvasRef.current) {
      fabricSignatureCanvasRef.current = new Canvas(signatureCanvasRef.current, {
        isDrawingMode: true,
        width: 300,
        height: 150,
        backgroundColor: '#f8f9fa'
      });
      
      if (fabricSignatureCanvasRef.current.freeDrawingBrush) {
        fabricSignatureCanvasRef.current.freeDrawingBrush.width = 2;
        fabricSignatureCanvasRef.current.freeDrawingBrush.color = penColor;
      }
    }

    return () => {
      fabricStampCanvasRef.current?.dispose();
      fabricSignatureCanvasRef.current?.dispose();
    };
  }, []);

  // Set drawing mode explicitly when switching to draw mode
  useEffect(() => {
    if (drawMode === 'draw') {
      if (fabricStampCanvasRef.current) {
        fabricStampCanvasRef.current.isDrawingMode = true;
        if (fabricStampCanvasRef.current.freeDrawingBrush) {
          fabricStampCanvasRef.current.freeDrawingBrush.color = penColor;
        }
      }
      if (fabricSignatureCanvasRef.current) {
        fabricSignatureCanvasRef.current.isDrawingMode = true;
        if (fabricSignatureCanvasRef.current.freeDrawingBrush) {
          fabricSignatureCanvasRef.current.freeDrawingBrush.color = penColor;
        }
      }
    }
  }, [drawMode, penColor]);

  // Update pen color when it changes
  useEffect(() => {
    if (fabricStampCanvasRef.current && fabricStampCanvasRef.current.freeDrawingBrush) {
      fabricStampCanvasRef.current.freeDrawingBrush.color = penColor;
    }
    if (fabricSignatureCanvasRef.current && fabricSignatureCanvasRef.current.freeDrawingBrush) {
      fabricSignatureCanvasRef.current.freeDrawingBrush.color = penColor;
    }
  }, [penColor]);

  // Load images if they exist
  useEffect(() => {
    if (stampUrl && fabricStampCanvasRef.current && drawMode === 'draw') {
      const img = new Image();
      img.src = stampUrl;
      img.onload = () => {
        if (!fabricStampCanvasRef.current) return;
        
        fabricStampCanvasRef.current.clear();
        
        // Correctly using FabricImage.fromURL with the right parameter order
        FabricImage.fromURL(stampUrl).then((fabricImg) => {
          if (!fabricStampCanvasRef.current) return;
          
          // Calculate scale to fit the canvas
          const scaleX = fabricStampCanvasRef.current.width / img.width;
          const scaleY = fabricStampCanvasRef.current.height / img.height;
          
          fabricImg.set({
            scaleX,
            scaleY,
            selectable: false,
            evented: false
          });
          
          fabricStampCanvasRef.current.backgroundImage = fabricImg;
          fabricStampCanvasRef.current.renderAll();
        });
      };
    }

    if (signatureUrl && fabricSignatureCanvasRef.current && drawMode === 'draw') {
      const img = new Image();
      img.src = signatureUrl;
      img.onload = () => {
        if (!fabricSignatureCanvasRef.current) return;
        
        fabricSignatureCanvasRef.current.clear();
        
        // Correctly using FabricImage.fromURL with the right parameter order
        FabricImage.fromURL(signatureUrl).then((fabricImg) => {
          if (!fabricSignatureCanvasRef.current) return;
          
          // Calculate scale to fit the canvas
          const scaleX = fabricSignatureCanvasRef.current.width / img.width;
          const scaleY = fabricSignatureCanvasRef.current.height / img.height;
          
          fabricImg.set({
            scaleX,
            scaleY,
            selectable: false,
            evented: false
          });
          
          fabricSignatureCanvasRef.current.backgroundImage = fabricImg;
          fabricSignatureCanvasRef.current.renderAll();
        });
      };
    }
  }, [stampUrl, signatureUrl, drawMode]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'stamp' | 'signature') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const updateField = type === 'stamp' ? 'doctor_stamp_url' : 'doctor_signature_url';
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [updateField]: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: "Success",
        description: `Doctor's ${type} updated successfully`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to upload ${type}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveCanvas = async (type: 'stamp' | 'signature') => {
    try {
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const canvas = type === 'stamp' 
        ? fabricStampCanvasRef.current 
        : fabricSignatureCanvasRef.current;

      if (!canvas) return;

      // Convert canvas to blob
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 1
      });
      
      // Convert data URL to Blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      const fileName = `${user.id}/${type}_${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          upsert: true,
          contentType: 'image/png',
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const updateField = type === 'stamp' ? 'doctor_stamp_url' : 'doctor_signature_url';
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [updateField]: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: "Success",
        description: `Doctor's ${type} saved successfully`,
      });
      
      // Switch back to upload mode after saving
      setDrawMode('upload');
    } catch (error) {
      console.error('Error saving canvas:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save ${type}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearCanvas = (type: 'stamp' | 'signature') => {
    const canvas = type === 'stamp' 
      ? fabricStampCanvasRef.current 
      : fabricSignatureCanvasRef.current;
    
    if (canvas) {
      canvas.clear();
      canvas.backgroundColor = '#f8f9fa';
      canvas.renderAll();
    }
  };

  const handleUndo = (type: 'stamp' | 'signature') => {
    const canvas = type === 'stamp' 
      ? fabricStampCanvasRef.current 
      : fabricSignatureCanvasRef.current;
    
    if (canvas && canvas._objects && canvas._objects.length > 0) {
      canvas.remove(canvas._objects[canvas._objects.length - 1]);
    }
  };
  
  const handleCancel = () => {
    // Return to upload mode without saving
    setDrawMode('upload');
  };

  const handlePenColorChange = (color: string) => {
    setPenColor(color);
    
    if (fabricStampCanvasRef.current && fabricStampCanvasRef.current.freeDrawingBrush) {
      fabricStampCanvasRef.current.freeDrawingBrush.color = color;
    }
    
    if (fabricSignatureCanvasRef.current && fabricSignatureCanvasRef.current.freeDrawingBrush) {
      fabricSignatureCanvasRef.current.freeDrawingBrush.color = color;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Doctor's Stamp & Signature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs 
            defaultValue="stamp" 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as 'stamp' | 'signature')}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="stamp">Official Stamp</TabsTrigger>
              <TabsTrigger value="signature">Signature</TabsTrigger>
            </TabsList>

            <TabsContent value="stamp" className="space-y-4">
              <div className="flex space-x-3">
                <Button 
                  variant={drawMode === 'upload' ? "default" : "outline"} 
                  onClick={() => setDrawMode('upload')}
                  size="sm"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
                <Button 
                  variant={drawMode === 'draw' ? "default" : "outline"} 
                  onClick={() => setDrawMode('draw')}
                  size="sm"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Draw
                </Button>
              </div>

              {drawMode === 'upload' ? (
                <div className="flex items-center gap-4">
                  {stampUrl ? (
                    <div className="relative w-32 h-32">
                      <img
                        src={stampUrl}
                        alt="Doctor's Stamp"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                      <p className="text-sm text-muted-foreground">No stamp uploaded</p>
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      id="stamp-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'stamp')}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('stamp-upload')?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {stampUrl ? 'Update Stamp' : 'Upload Stamp'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex space-x-4 items-center">
                    <Label>Pen Color:</Label>
                    <RadioGroup 
                      defaultValue={penColor} 
                      value={penColor}
                      onValueChange={handlePenColorChange}
                      className="flex space-x-2"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem 
                          value="#000000" 
                          id="black" 
                          className="h-4 w-4 rounded-full bg-black hover:bg-gray-800" 
                        />
                        <Label htmlFor="black">Black</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem 
                          value="#0000FF" 
                          id="blue" 
                          className="h-4 w-4 rounded-full bg-blue-600 hover:bg-blue-700" 
                        />
                        <Label htmlFor="blue">Blue</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem 
                          value="#FF0000" 
                          id="red" 
                          className="h-4 w-4 rounded-full bg-red-600 hover:bg-red-700" 
                        />
                        <Label htmlFor="red">Red</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="border rounded-md p-2 bg-white">
                    <canvas ref={stampCanvasRef} />
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleClearCanvas('stamp')}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleUndo('stamp')}
                    >
                      <Undo className="h-4 w-4 mr-2" />
                      Undo
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleSaveCanvas('stamp')}
                      disabled={isUploading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Stamp
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="signature" className="space-y-4">
              <div className="flex space-x-3">
                <Button 
                  variant={drawMode === 'upload' ? "default" : "outline"} 
                  onClick={() => setDrawMode('upload')}
                  size="sm"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
                <Button 
                  variant={drawMode === 'draw' ? "default" : "outline"} 
                  onClick={() => setDrawMode('draw')}
                  size="sm"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Draw
                </Button>
              </div>

              {drawMode === 'upload' ? (
                <div className="flex items-center gap-4">
                  {signatureUrl ? (
                    <div className="relative w-32 h-32">
                      <img
                        src={signatureUrl}
                        alt="Doctor's Signature"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                      <p className="text-sm text-muted-foreground">No signature uploaded</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <input
                      type="file"
                      id="signature-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'signature')}
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('signature-upload')?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {signatureUrl ? 'Update Signature' : 'Upload Signature'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex space-x-4 items-center">
                    <Label>Pen Color:</Label>
                    <RadioGroup 
                      defaultValue={penColor} 
                      value={penColor}
                      onValueChange={handlePenColorChange}
                      className="flex space-x-2"
                    >
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem 
                          value="#000000" 
                          id="black-sig" 
                          className="h-4 w-4 rounded-full bg-black hover:bg-gray-800" 
                        />
                        <Label htmlFor="black-sig">Black</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem 
                          value="#0000FF" 
                          id="blue-sig" 
                          className="h-4 w-4 rounded-full bg-blue-600 hover:bg-blue-700" 
                        />
                        <Label htmlFor="blue-sig">Blue</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem 
                          value="#FF0000" 
                          id="red-sig" 
                          className="h-4 w-4 rounded-full bg-red-600 hover:bg-red-700" 
                        />
                        <Label htmlFor="red-sig">Red</Label>
                      </div>
                    </RadioGroup>
                  </div>
                
                  <div className="border rounded-md p-2 bg-white">
                    <canvas ref={signatureCanvasRef} />
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleClearCanvas('signature')}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleUndo('signature')}
                    >
                      <Undo className="h-4 w-4 mr-2" />
                      Undo
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleSaveCanvas('signature')}
                      disabled={isUploading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Signature
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
