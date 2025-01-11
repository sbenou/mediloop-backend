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

  // Get the Supabase storage URLs for the sample images
  const { data: { publicUrl: sampleFrontImage } } = supabase.storage
    .from('lovable-uploads')
    .getPublicUrl('CNS front.png');

  const { data: { publicUrl: sampleBackImage } } = supabase.storage
    .from('lovable-uploads')
    .getPublicUrl('CNS back.png');

  const sampleCardNumber = "12345678901";

  const handleCapture = useCallback(() => {
    setScanning(true);
    
    if (step === 'front') {
      setFrontImage(sampleFrontImage);
      setStep('back');
      toast({
        title: "Front side captured",
        description: "Please scan the back side of your CNS card",
      });
      setScanning(false);
    } else {
      // Simulate successful scan with the full Supabase URLs
      setTimeout(() => {
        onScanComplete(sampleFrontImage, sampleBackImage, sampleCardNumber);
        toast({
          title: "Success",
          description: "CNS card successfully scanned",
        });
        setScanning(false);
      }, 1000);
    }
  }, [step, onScanComplete, sampleFrontImage, sampleBackImage]);

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
            <img
              src={step === 'front' ? sampleFrontImage : sampleBackImage}
              alt={`Sample CNS card ${step} side`}
              className="h-full w-full object-contain"
            />
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