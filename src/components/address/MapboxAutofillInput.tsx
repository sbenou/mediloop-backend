
import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { loadMapboxSearchSDK } from "@/services/address-service";
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
  const [isLoading, setIsLoading] = useState(false);
  const autofillCollectionRef = useRef<any>(null);
  
  // Attach event listener for address selection
  useEffect(() => {
    if (!formRef.current || !onAddressSelected) return;
    
    const handleAutofill = (event: any) => {
      const feature = event.detail?.feature;
      if (feature) {
        console.log("Address selected:", feature);
        onAddressSelected(feature);
      }
    };
    
    // Clean up previous event listener to avoid duplicates
    formRef.current.removeEventListener('autofill', handleAutofill);
    // Add new event listener
    formRef.current.addEventListener('autofill', handleAutofill);
    
    // Cleanup on unmount
    return () => {
      if (formRef.current) {
        formRef.current.removeEventListener('autofill', handleAutofill);
      }
    };
  }, [formRef, onAddressSelected]);

  // Initialize Mapbox autofill
  useEffect(() => {
    if (!inputRef.current || !formRef.current) return;
    
    let mounted = true;
    
    const initializeAutofill = async () => {
      try {
        setIsLoading(true);
        
        // Ensure input has the required attribute
        if (inputRef.current) {
          inputRef.current.setAttribute('autocomplete', 'street-address');
        }
        
        // Load the Mapbox SDK
        await loadMapboxSearchSDK();
        
        if (!mounted || !window.MapboxSearchSDK || !inputRef.current || !formRef.current) {
          setIsLoading(false);
          return;
        }
        
        // Initialize autofill using the documented approach
        const collection = window.MapboxSearchSDK.autofill({
          accessToken: 'pk.eyJ1IjoibG92YWJsZS10ZXN0IiwiYSI6ImNscmN0ZG96ZjBjemsyaXQ0Nm8zcnhkY2MifQ.IYYu7fJKa45S4TXxTV6-KA',
          options: {
            language: 'en',
            country: 'lu',
            minimap: true
          }
        });
        
        autofillCollectionRef.current = collection;
        
        // Force update to ensure input is recognized after DOM changes
        if (collection && collection.update) {
          setTimeout(() => {
            if (mounted && collection.update) {
              collection.update();
            }
          }, 100);
        }
        
        if (mounted) {
          setIsLoading(false);
          
          // Focus input after initialization if autoFocus is true
          if (autoFocus && inputRef.current) {
            setTimeout(() => {
              if (mounted && inputRef.current) {
                inputRef.current.focus();
              }
            }, 50);
          }
        }
      } catch (error) {
        console.error("Error initializing Mapbox Autofill:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    initializeAutofill();
    
    return () => {
      mounted = false;
      if (autofillCollectionRef.current && autofillCollectionRef.current.remove) {
        try {
          autofillCollectionRef.current.remove();
        } catch (e) {
          console.error("Error removing autofill instance:", e);
        }
      }
    };
  }, [formRef, autoFocus]);

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
        autoFocus={autoFocus}
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
