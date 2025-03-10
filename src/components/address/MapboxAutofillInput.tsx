
import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { loadMapboxSearchSDK, initializeMapboxAutofill } from "@/services/address-service";
import { Loader2 } from "lucide-react";

interface MapboxAutofillInputProps {
  formRef: React.RefObject<HTMLFormElement>;
  initialValue?: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
  onAddressSelected?: (address: any) => void;
}

const MapboxAutofillInput = ({
  formRef,
  initialValue = "",
  className = "",
  placeholder = "Start typing your address...",
  required = false,
  onAddressSelected
}: MapboxAutofillInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const autofillInstanceRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const initializeAutofill = async () => {
      try {
        setIsLoading(true);
        await loadMapboxSearchSDK();
        
        if (!mounted || !inputRef.current || !formRef.current) return;
        
        const setupAutofill = () => {
          if (!mounted || !inputRef.current || !formRef.current) return;
          
          // Add required autocomplete attribute
          inputRef.current.setAttribute('autocomplete', 'street-address');
          
          // Initialize autofill
          const autofillInstance = initializeMapboxAutofill(
            inputRef.current,
            formRef.current
          );
          
          if (autofillInstance && onAddressSelected) {
            formRef.current.addEventListener('autofill', (event: any) => {
              const feature = event.detail?.feature;
              if (feature) {
                onAddressSelected(feature);
              }
            });
          }
          
          autofillInstanceRef.current = autofillInstance;
          setIsLoading(false);
        };

        // Wait for next render cycle to ensure DOM is ready
        setTimeout(setupAutofill, 100);
      } catch (error) {
        console.error("Error initializing Mapbox Autofill:", error);
        setIsLoading(false);
      }
    };

    initializeAutofill();

    return () => {
      mounted = false;
      if (autofillInstanceRef.current) {
        try {
          autofillInstanceRef.current.remove();
        } catch (e) {
          console.error("Error removing autofill instance:", e);
        }
      }
    };
  }, [formRef, onAddressSelected]);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        defaultValue={initialValue}
        className={className}
        placeholder={placeholder}
        required={required}
        disabled={isLoading}
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default MapboxAutofillInput;
