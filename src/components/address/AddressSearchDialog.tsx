
import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { confirmMapboxAddress } from "@/services/address-service";
import MapboxAutofillInput from "./MapboxAutofillInput";
import MapboxMinimap from "./MapboxMinimap";

interface AddressSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAddress: (address: string) => void;
  initialValue?: string;
}

const AddressSearchDialog = ({ 
  open, 
  onOpenChange, 
  onSelectAddress,
  initialValue = ""
}: AddressSearchDialogProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [showMinimap, setShowMinimap] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedFeature(null);
      setShowMinimap(false);
    }
  }, [open]);

  const handleAddressSelected = (feature: any) => {
    console.log("Address selected:", feature);
    setSelectedFeature(feature);
    setShowMinimap(true);
  };

  const handleLocationChange = (feature: any) => {
    console.log("Location changed on map:", feature);
    setSelectedFeature(feature);
  };

  const handleConfirmAddress = async () => {
    if (!formRef.current) return;
    
    setIsProcessing(true);
    
    try {
      // Confirm the address using Mapbox
      const result = await confirmMapboxAddress(formRef.current, true);
      console.log("Address confirmation result:", result);
      
      if (result.type === 'accepted' || result.type === 'nochange') {
        // Get the final address from the form
        if (formRef.current) {
          const formattedAddress = selectedFeature?.properties?.full_address || 
                                  selectedFeature?.properties?.place_name || 
                                  initialValue;
                                  
          onSelectAddress(formattedAddress);
          onOpenChange(false);
          
          toast({
            title: "Address Selected",
            description: "The address has been successfully selected."
          });
        }
      }
    } catch (error) {
      console.error("Error confirming address:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem confirming the address."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search Address</DialogTitle>
        </DialogHeader>
        
        <form ref={formRef} className="space-y-4 py-2">
          <div className="relative">
            <MapboxAutofillInput
              formRef={formRef}
              initialValue={initialValue}
              placeholder="Start typing your address..."
              className="w-full"
              onAddressSelected={handleAddressSelected}
            />
          </div>
          
          {showMinimap && selectedFeature && (
            <div className="space-y-2">
              <MapboxMinimap 
                feature={selectedFeature} 
                height="200px"
                onLocationChange={handleLocationChange}
              />
              <p className="text-xs text-muted-foreground">
                Drag the pin to adjust the exact location if needed.
              </p>
            </div>
          )}
        </form>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAddress}
            disabled={!selectedFeature || isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                Processing...
              </>
            ) : (
              "Confirm Address"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddressSearchDialog;
