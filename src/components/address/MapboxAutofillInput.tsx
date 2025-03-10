
import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
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
  const autofillInstanceRef = useRef<any>(null);

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
    let timeoutId: number;
    
    const initializeAutofill = async () => {
      try {
        // Only show loading state if it takes more than a short delay
        timeoutId = window.setTimeout(() => {
          if (mounted) setIsLoading(true);
        }, 100);
        
        // Ensure input has the required attribute for Mapbox autofill
        if (inputRef.current) {
          inputRef.current.setAttribute('autocomplete', 'street-address');
        }
        
        // Check if Mapbox SDK is already loaded
        if (!window.MapboxSearchSDK) {
          await loadMapboxScript();
        }
        
        if (!mounted) return;
        
        if (autofillInstanceRef.current) {
          try {
            autofillInstanceRef.current.remove();
          } catch (e) {
            console.error("Error removing previous autofill instance:", e);
          }
        }
        
        // Initialize autofill using the approach from the docs
        if (window.MapboxSearchSDK) {
          autofillInstanceRef.current = window.MapboxSearchSDK.autofill({
            accessToken: 'pk.eyJ1IjoibG92YWJsZS10ZXN0IiwiYSI6ImNscmN0ZG96ZjBjemsyaXQ0Nm8zcnhkY2MifQ.IYYu7fJKa45S4TXxTV6-KA',
            options: {
              language: 'en',
              country: 'lu',
              minimap: true
            }
          });
          
          console.log("Mapbox autofill initialized successfully");
        }
        
        // Clear loading state
        clearTimeout(timeoutId);
        if (mounted) setIsLoading(false);
        
        // Focus the input after a short delay
        if (autoFocus && inputRef.current) {
          setTimeout(() => {
            if (mounted && inputRef.current && !inputRef.current.disabled) {
              inputRef.current.focus();
            }
          }, 50);
        }
      } catch (error) {
        console.error("Error initializing Mapbox Autofill:", error);
        clearTimeout(timeoutId);
        if (mounted) setIsLoading(false);
      }
    };
    
    // Load Mapbox script
    const loadMapboxScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (window.MapboxSearchSDK) {
          return resolve();
        }
        
        const script = document.getElementById('mapbox-search-sdk') as HTMLScriptElement;
        if (script) {
          script.onload = () => resolve();
          script.onerror = (e) => reject(e);
          return;
        }
        
        const newScript = document.createElement('script');
        newScript.id = 'mapbox-search-sdk';
        newScript.src = 'https://api.mapbox.com/search-js/v1.0.0-beta.18/web.js';
        newScript.async = true;
        
        newScript.onload = () => {
          console.log("Mapbox script loaded successfully");
          resolve();
        };
        
        newScript.onerror = (e) => {
          console.error("Failed to load Mapbox script:", e);
          reject(e);
        };
        
        document.head.appendChild(newScript);
      });
    };
    
    // Initialize immediately
    initializeAutofill();
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      
      if (autofillInstanceRef.current && autofillInstanceRef.current.remove) {
        try {
          autofillInstanceRef.current.remove();
          autofillInstanceRef.current = null;
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

// Add TypeScript interface for window to access Mapbox Search SDK
declare global {
  interface Window {
    MapboxSearchSDK: any;
  }
}

export default MapboxAutofillInput;
