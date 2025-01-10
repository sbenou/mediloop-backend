import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { BarcodeFormat, DecodeHintType, BrowserMultiFormatReader } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";

interface CNSCardScannerProps {
  onClose: () => void;
  onScanComplete: (frontImage: string, backImage: string, cardNumber: string) => void;
}

const CNSCardScanner = ({ onClose, onScanComplete }: CNSCardScannerProps) => {
  const webcamRef = useRef<Webcam>(null);
  const [step, setStep] = useState<'front' | 'back'>('front');
  const [frontImage, setFrontImage] = useState<string>('');
  const [scanning, setScanning] = useState(false);

  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
  const reader = new BrowserMultiFormatReader(hints);

  const captureImage = useCallback(async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    if (step === 'front') {
      setFrontImage(imageSrc);
      setStep('back');
      toast({
        title: "Front side captured",
        description: "Please scan the back side of your CNS card",
      });
    } else {
      try {
        setScanning(true);
        // Attempt to read barcode from the back image
        const imageElement = document.createElement('img');
        imageElement.src = imageSrc;
        await new Promise(resolve => imageElement.onload = resolve);
        
        const result = await reader.decodeFromImage(imageElement);
        const cardNumber = result?.getText();

        if (!cardNumber) {
          toast({
            title: "Error",
            description: "Could not read card number. Please try again.",
            variant: "destructive",
          });
          return;
        }

        onScanComplete(frontImage, imageSrc, cardNumber);
        toast({
          title: "Success",
          description: "CNS card successfully scanned",
        });
      } catch (error) {
        console.error('Error scanning barcode:', error);
        toast({
          title: "Error",
          description: "Failed to read card number. Please try again.",
          variant: "destructive",
        });
      } finally {
        setScanning(false);
      }
    }
  }, [step, frontImage, onScanComplete, reader]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Scan {step === 'front' ? 'front' : 'back'} side of CNS card
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full rounded-lg"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={captureImage} disabled={scanning}>
              {scanning ? "Processing..." : "Capture"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CNSCardScanner;