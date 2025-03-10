
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
  autoFocus?: boolean;
}

const MapboxAutofillInput = ({
  formRef,
  initialValue = "",
  className = "",
  placeholder = "Start typing your address...",
  required = false,
  onAddressSelected,
  autoFocus = true
}: MapboxAutofillInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false); // Changed initial state to false
  const autofillInstanceRef = useRef<any>(null);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  // Load SDK separately from initialization to improve performance
  useEffect(() => {
    let mounted = true;

    const loadSDK = async () => {
      try {
        await loadMapboxSearchSDK();
        if (mounted) {
          setIsSDKLoaded(true);
        }
      } catch (error) {
        console.error("Error loading Mapbox Search SDK:", error);
        // Even if loading fails, we should enable the input
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadSDK();

    return () => {
      mounted = false;
    };
  }, []);

  // Initialize autofill once SDK is loaded
  useEffect(() => {
    if (!isSDKLoaded || !inputRef.current || !formRef.current) return;

    let mounted = true;
    
    const initAutofill = async () => {
      try {
        setIsLoading(true);
        
        // Add required autocomplete attribute
        if (inputRef.current) {
          inputRef.current.setAttribute('autocomplete', 'street-address');
        }
        
        // Initialize autofill with proper settings
        const autofillInstance = initializeMapboxAutofill(
          inputRef.current,
          formRef.current,
          {
            language: 'en',
            country: 'lu',
            minimap: true,
            coordinates: true
          }
        );
        
        // Set up event listener for address selection
        if (autofillInstance && onAddressSelected && formRef.current) {
          const handleAutofill = (event: any) => {
            const feature = event.detail?.feature;
            if (feature) {
              onAddressSelected(feature);
            }
          };
          
          // Remove previous event listener to avoid duplicates
          formRef.current.removeEventListener('autofill', handleAutofill);
          // Add the event listener
          formRef.current.addEventListener('autofill', handleAutofill);
        }
        
        autofillInstanceRef.current = autofillInstance;
        
        if (mounted) {
          setIsLoading(false);
        }
        
        // Focus the input after initialization
        if (autoFocus && inputRef.current && mounted) {
          inputRef.current.focus();
        }
      } catch (error) {
        console.error("Error initializing Mapbox Autofill:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAutofill();

    return () => {
      mounted = false;
      if (autofillInstanceRef.current) {
        try {
          autofillInstanceRef.current.remove();
        } catch (e) {
          console.error("Error removing autofill instance:", e);
        }
      }
      
      // Clean up event listeners
      if (formRef.current) {
        formRef.current.removeEventListener('autofill', () => {});
      }
    };
  }, [formRef, onAddressSelected, autoFocus, isSDKLoaded]);

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
        autoFocus={autoFocus && !isLoading}
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
