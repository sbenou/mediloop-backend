
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
  
  // Check if user has a default address
  useEffect(() => {
    const checkUserAddress = async () => {
      console.log("CountrySelector: Checking user address");
      
      if (isAuthenticated && user) {
        console.log("CountrySelector: User is authenticated, checking for default address");
        // Fetch user's main address
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .single();
        
        if (!error && data) {
          console.log("CountrySelector: Found default address:", data);
          setMainAddress(data);
          
          // Set location based on country
          if (data.country === "Luxembourg" || data.country === "LU") {
            setUserLocation(AVAILABLE_COUNTRIES.find(c => c.code === "LU")?.coordinates || userLocation);
          } else if (data.country === "France" || data.country === "FR") {
            setUserLocation(AVAILABLE_COUNTRIES.find(c => c.code === "FR")?.coordinates || userLocation);
          }

          // Don't show dialog if user has a default address
          return;
        } else {
          console.log("CountrySelector: No default address found or error:", error);
        }
      } else {
        console.log("CountrySelector: User is not authenticated");
      }
      
      // Show dialog for anonymous users or authenticated users without a default address
      const savedCountry = localStorage.getItem('selectedCountry');
      if (savedCountry) {
        console.log("CountrySelector: Found saved country:", savedCountry);
        setSelectedCountry(savedCountry);
        const country = AVAILABLE_COUNTRIES.find(c => c.code === savedCountry);
        if (country) {
          setUserLocation(country.coordinates);
        }
      } else {
        console.log("CountrySelector: No saved country, showing dialog");
        // Force open the dialog after a short delay to ensure it's visible
        setTimeout(() => {
          setOpen(true);
        }, 100);
      }
    };
    
    // Clear country selection from localStorage for testing purposes
    // Comment this out in production
    // localStorage.removeItem('selectedCountry');
    
    checkUserAddress();
  }, [isAuthenticated, user, setUserLocation, userLocation]);
  
  const handleSelectCountry = () => {
    console.log("CountrySelector: Selecting country:", selectedCountry);
    const country = AVAILABLE_COUNTRIES.find(c => c.code === selectedCountry);
    if (country) {
      setUserLocation(country.coordinates);
      localStorage.setItem('selectedCountry', selectedCountry);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
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
  );
};

export default CountrySelector;
