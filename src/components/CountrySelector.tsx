
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
import { ErrorBoundary } from "react-error-boundary";

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

// Default coordinates (Luxembourg)
const DEFAULT_COORDINATES = {
  lat: 49.8153,
  lon: 6.1296
};

const CountrySelectorContent = () => {
  const [open, setOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("LU");
  const [userLocation, setUserLocation] = useRecoilState(userLocationState);
  const { isAuthenticated, user } = useAuth();
  const [mainAddress, setMainAddress] = useState<Address | null>(null);
  
  // Check if user has a default address
  useEffect(() => {
    const checkUserAddress = async () => {
      if (isAuthenticated && user) {
        // Fetch user's main address
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .single();
        
        if (!error && data) {
          setMainAddress(data);
          
          // Set location based on country
          if (data.country === "Luxembourg" || data.country === "LU") {
            setUserLocation(AVAILABLE_COUNTRIES.find(c => c.code === "LU")?.coordinates || userLocation);
          } else if (data.country === "France" || data.country === "FR") {
            setUserLocation(AVAILABLE_COUNTRIES.find(c => c.code === "FR")?.coordinates || userLocation);
          }

          // Don't show dialog if user has a default address
          return;
        }
      }
      
      // Show dialog for anonymous users or authenticated users without a default address
      const savedCountry = localStorage.getItem('selectedCountry');
      if (savedCountry) {
        setSelectedCountry(savedCountry);
        const country = AVAILABLE_COUNTRIES.find(c => c.code === savedCountry);
        if (country) {
          setUserLocation(country.coordinates);
        }
      } else {
        setOpen(true);
      }
    };
    
    checkUserAddress();
  }, [isAuthenticated, user, setUserLocation, userLocation]);
  
  const handleSelectCountry = () => {
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

// Main component with error boundary
const CountrySelector = () => {
  return (
    <ErrorBoundary fallback={<div className="hidden">Error loading country selector</div>}>
      <CountrySelectorContent />
    </ErrorBoundary>
  );
};

export default CountrySelector;
