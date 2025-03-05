
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
  const [open, setOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("LU");
  const [userLocation, setUserLocation] = useRecoilState(userLocationState);
  const { isAuthenticated, user } = useAuth();
  const [mainAddress, setMainAddress] = useState<Address | null>(null);
  
  useEffect(() => {
    const checkUserAddress = async () => {
      console.log("CountrySelector: Checking user address");
      
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
            } else if (data.country === "France" || data.country === "FR") {
              setUserLocation(AVAILABLE_COUNTRIES.find(c => c.code === "FR")?.coordinates || userLocation);
            }

            return;
          } else {
            console.log("CountrySelector: No default address found or error:", error);
          }
        } catch (e) {
          console.error("Error fetching address:", e);
        }
      } else {
        console.log("CountrySelector: User is not authenticated");
      }
      
      // Check if there's a saved country in localStorage
      try {
        const savedCountry = localStorage.getItem('selectedCountry');
        if (savedCountry) {
          console.log("CountrySelector: Found saved country:", savedCountry);
          setSelectedCountry(savedCountry);
          const country = AVAILABLE_COUNTRIES.find(c => c.code === savedCountry);
          if (country) {
            setUserLocation(country.coordinates);
          }
          // Only return early if we've successfully used the saved country
          return;
        }
      } catch (e) {
        console.error("Error reading from localStorage:", e);
      }
      
      // If we get here, we need to show the dialog
      console.log("CountrySelector: No saved country or localStorage error, showing dialog");
      setTimeout(() => {
        setOpen(true);
      }, 100);
    };
    
    checkUserAddress();
    
    // Add an event listener to handle storage clear events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === null) {
        // This indicates a clear() operation was performed
        console.log("CountrySelector: Storage clear detected");
        setTimeout(() => {
          setOpen(true);
        }, 100);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated, user, setUserLocation, userLocation]);
  
  // Apply overlay styles when dialog is open
  useEffect(() => {
    if (open) {
      // Add style to hide navigation trigger highlighting
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
      // Remove style when dialog is closed
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
      } catch (e) {
        console.error("Error saving to localStorage:", e);
      }
      setOpen(false);
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
        onOpenChange={setOpen} 
        modal={true}
      >
        <DialogContent 
          className="sm:max-w-md z-[100001]" 
          forceMount
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
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
