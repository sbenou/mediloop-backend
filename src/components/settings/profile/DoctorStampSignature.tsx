import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Pencil } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Canvas } from "fabric";

interface DoctorStampSignatureProps {
  stampUrl: string | null;
  signatureUrl: string | null;
}

export const DoctorStampSignature = ({ stampUrl, signatureUrl }: DoctorStampSignatureProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Doctor's Stamp & Signature</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stamp Section */}
          <div className="space-y-4">
            <h3 className="font-medium">Official Stamp</h3>
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
          </div>

          {/* Signature Section */}
          <div className="space-y-4">
            <h3 className="font-medium">Signature</h3>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};