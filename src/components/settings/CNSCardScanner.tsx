import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

interface CNSCardScannerProps {
  onClose: () => void;
  onScanComplete: (frontImage: string, backImage: string, cardNumber: string) => void;
}

const CNSCardScanner = ({ onClose, onScanComplete }: CNSCardScannerProps) => {
  const [step, setStep] = useState<'front' | 'back'>('front');
  const [frontImage, setFrontImage] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCapture = useCallback(async () => {
    setScanning(true);
    setImageError(false);
    
    try {
      // First check if the sample image exists
      const sampleImageResponse = await fetch(step === 'front' ? '/sample-front.png' : '/sample-back.png');
      if (!sampleImageResponse.ok) {
        throw new Error(`Failed to load sample image: ${sampleImageResponse.statusText}`);
      }

      const imageBlob = await sampleImageResponse.blob();
      console.log('Sample image loaded successfully, size:', imageBlob.size);

      if (step === 'front') {
        const { data: frontData, error: frontError } = await supabase.storage
          .from('lovable-uploads')
          .upload('8e0651b0-5b95-4f7d-bdf8-9d8995d6c915.png', imageBlob, {
            upsert: true // Add upsert option to handle existing files
          });
        
        if (frontError) {
          console.error('Supabase upload error:', frontError);
          throw frontError;
        }
        
        if (frontData) {
          const { data: { publicUrl: frontUrl } } = supabase.storage
            .from('lovable-uploads')
            .getPublicUrl('8e0651b0-5b95-4f7d-bdf8-9d8995d6c915.png');
          
          console.log('Front image uploaded successfully, URL:', frontUrl);
          setFrontImage(frontUrl);
          setStep('back');
          toast({
            title: "Front side captured",
            description: "Please scan the back side of your CNS card",
          });
        }
      } else {
        const { data: backData, error: backError } = await supabase.storage
          .from('lovable-uploads')
          .upload('5a25d363-d8b5-44bd-a39d-d9bfcc4d50c5.png', imageBlob, {
            upsert: true // Add upsert option to handle existing files
          });
        
        if (backError) {
          console.error('Supabase upload error:', backError);
          throw backError;
        }
        
        if (backData) {
          const { data: { publicUrl: backUrl } } = supabase.storage
            .from('lovable-uploads')
            .getPublicUrl('5a25d363-d8b5-44bd-a39d-d9bfcc4d50c5.png');
          
          console.log('Back image uploaded successfully, URL:', backUrl);
          const sampleCardNumber = "12345678901";
          onScanComplete(frontImage, backUrl, sampleCardNumber);
          
          toast({
            title: "Success",
            description: "CNS card successfully scanned",
          });
        }
      }
    } catch (error) {
      console.error('Error in handleCapture:', error);
      setImageError(true);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload image. Please try again.",
      });
    } finally {
      setScanning(false);
    }
  }, [step, onScanComplete, frontImage]);

  const { data: { publicUrl: currentImage } } = supabase.storage
    .from('lovable-uploads')
    .getPublicUrl(step === 'front' ? '8e0651b0-5b95-4f7d-bdf8-9d8995d6c915.png' : '5a25d363-d8b5-44bd-a39d-d9bfcc4d50c5.png');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Scan {step === 'front' ? 'front' : 'back'} side of CNS card
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="relative aspect-[1.586] w-full overflow-hidden rounded-lg border bg-muted">
            {imageError ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Error loading image. Please try again.
              </div>
            ) : (
              <img
                src={currentImage}
                alt={`Sample CNS card ${step} side`}
                className="h-full w-full object-contain"
                onError={(e) => {
                  console.error('Error loading image:', currentImage);
                  setImageError(true);
                }}
              />
            )}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCapture} disabled={scanning}>
              {scanning ? "Processing..." : "Capture"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CNSCardScanner;