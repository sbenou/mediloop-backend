
import { useState, useEffect } from "react";
import { useRecoilState } from "recoil";
import { useAuth } from "@/hooks/auth/useAuth";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { userLocationState } from "@/store/location/atoms";
import ReactCountryFlag from "react-country-flag";
import { Address } from "@/types/supabase";

type Country = {
  code: string;
  name: string;
  coordinates: { lat: number; lon: number };
};

const AVAILABLE_COUNTRIES: Country[] = [
  { 
    code: "LU", 
    name: "Luxembourg", 
    coordinates: { lat: 49.8153, lon: 6.1296 }
  },
  { 
    code: "FR", 
    name: "France", 
    coordinates: { lat: 46.603354, lon: 1.888334 }
  }
];

const CountrySelector = () => {
  const [open, setOpen] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>("LU");
  const [userLocation, setUserLocation] = useRecoilState(userLocationState);
  const { isAuthenticated, user } = useAuth();
  const [mainAddress, setMainAddress] = useState<Address | null>(null);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [selectionComplete, setSelectionComplete] = useState(false);
  
  // Initialize the dialog as open and reset any saved country
  useEffect(() => {
    console.log("CountrySelector: Component mounted, initializing");
    setOpen(true);
    
    // Try to clear any existing selection to force the dialog
    try {
      localStorage.removeItem('selectedCountry');
      console.log("CountrySelector: Cleared selectedCountry on mount");
    } catch (e) {
      console.error("Error clearing localStorage:", e);
    }
  }, []);
  
  // Force dialog to remain open only if no selection has been made
  useEffect(() => {
    if (!open && !selectionComplete) {
      console.log("CountrySelector: Dialog was closed without selection, forcing it open again");
      setOpen(true);
    }
  }, [open, selectionComplete]);
  
  useEffect(() => {
    let shouldShowDialog = true;
    
    const checkUserAddress = async () => {
      console.log("CountrySelector: Checking user address and country selection");
      
      // Check if user has a default address
      if (isAuthenticated && user) {
        console.log("CountrySelector: User is authenticated, checking for default address");
        try {
          const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_default', true)
            .single();
          
          if (!error && data) {
            console.log("CountrySelector: Found default address:", data);
            setMainAddress(data);
            
            if (data.country === "Luxembourg" || data.country === "LU") {
              setUserLocation(AVAILABLE_COUNTRIES.find(c => c.code === "LU")?.coordinates || userLocation);
              shouldShowDialog = false;
              setSelectionComplete(true);
            } else if (data.country === "France" || data.country === "FR") {
              setUserLocation(AVAILABLE_COUNTRIES.find(c => c.code === "FR")?.coordinates || userLocation);
              shouldShowDialog = false;
              setSelectionComplete(true);
            }
          } else {
            console.log("CountrySelector: No default address found or error:", error);
          }
        } catch (e) {
          console.error("Error fetching address:", e);
        }
      } else {
        console.log("CountrySelector: User is not authenticated");
      }
      
      // Even if we've already determined not to show the dialog,
      // still check localStorage to update the selected country
      try {
        const savedCountry = localStorage.getItem('selectedCountry');
        if (savedCountry) {
          console.log("CountrySelector: Found saved country:", savedCountry);
          setSelectedCountry(savedCountry);
          const country = AVAILABLE_COUNTRIES.find(c => c.code === savedCountry);
          if (country) {
            setUserLocation(country.coordinates);
            shouldShowDialog = false;
            setSelectionComplete(true);
          }
        } else {
          console.log("CountrySelector: No saved country found, dialog should appear");
          shouldShowDialog = true;
          setSelectionComplete(false);
        }
      } catch (e) {
        console.error("Error reading from localStorage:", e);
        shouldShowDialog = true;
        setSelectionComplete(false);
      }
      
      console.log("CountrySelector: Setting dialog open state to:", shouldShowDialog);
      setOpen(shouldShowDialog);
      setInitialCheckDone(true);
    };
    
    checkUserAddress();
    
    const handleStorageChange = (e: StorageEvent) => {
      console.log("CountrySelector: Storage event detected", e);
      if (e.key === null || e.key === 'selectedCountry') {
        console.log("CountrySelector: Storage clear or selectedCountry change detected");
        if (!localStorage.getItem('selectedCountry')) {
          setOpen(true);
          setSelectionComplete(false);
        } else {
          setSelectionComplete(true);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated, user, setUserLocation, userLocation]);
  
  // Apply style changes when dialog is open
  useEffect(() => {
    if (open) {
      const style = document.createElement('style');
      style.id = 'country-selector-overlay-style';
      style.innerHTML = `
        .navigation-menu-trigger {
          background-color: transparent !important;
          color: rgba(0,0,0,0.5) !important;
        }
        [data-state="open"] .navigation-menu-trigger {
          background-color: transparent !important;
          color: rgba(0,0,0,0.5) !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      const style = document.getElementById('country-selector-overlay-style');
      if (style) {
        document.head.removeChild(style);
      }
    }

    return () => {
      const style = document.getElementById('country-selector-overlay-style');
      if (style) {
        document.head.removeChild(style);
      }
    };
  }, [open]);

  const handleSelectCountry = () => {
    console.log("CountrySelector: Selecting country:", selectedCountry);
    const country = AVAILABLE_COUNTRIES.find(c => c.code === selectedCountry);
    if (country) {
      setUserLocation(country.coordinates);
      try {
        localStorage.setItem('selectedCountry', selectedCountry);
        console.log("CountrySelector: Country saved to localStorage");
        setSelectionComplete(true);
        setOpen(false); // Explicitly close the dialog
      } catch (e) {
        console.error("Error saving to localStorage:", e);
      }
    }
  };

  return (
    <>
      {open && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100000]" 
          style={{ 
            pointerEvents: "all",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 1,
            transition: "opacity 150ms ease-in-out"
          }}
        />
      )}
      <Dialog 
        open={open} 
        onOpenChange={(newOpenState) => {
          console.log("Dialog onOpenChange called with:", newOpenState);
          if (!newOpenState) {
            // Allow closing only if selection is complete
            if (selectionComplete) {
              setOpen(false);
            } else {
              console.log("CountrySelector: Preventing dialog from closing, no country selected");
              setOpen(true);
            }
          } else {
            setOpen(true);
          }
        }} 
        modal={true}
      >
        <DialogContent 
          className="sm:max-w-md z-[100001]" 
          forceMount
          onInteractOutside={(e) => {
            e.preventDefault();
            console.log("CountrySelector: Outside interaction prevented");
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            console.log("CountrySelector: Escape key prevented");
          }}
        >
          <DialogTitle>Select Your Country</DialogTitle>
          <DialogDescription>
            Please select your country to help us show relevant doctors and pharmacies in your area.
          </DialogDescription>
          
          <RadioGroup 
            value={selectedCountry} 
            onValueChange={setSelectedCountry}
            className="grid gap-4 my-4"
          >
            {AVAILABLE_COUNTRIES.map((country) => (
              <div key={country.code} className="flex items-center space-x-3 border p-3 rounded-md">
                <RadioGroupItem value={country.code} id={country.code} />
                <Label htmlFor={country.code} className="flex items-center cursor-pointer">
                  <ReactCountryFlag 
                    countryCode={country.code} 
                    svg 
                    className="mr-2" 
                    style={{ width: '1.5em', height: '1.5em' }}
                  />
                  <span>{country.name}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          <div className="flex justify-end mt-4">
            <Button onClick={handleSelectCountry}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CountrySelector;
