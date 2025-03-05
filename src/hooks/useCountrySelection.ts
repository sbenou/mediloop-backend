
import { useState, useEffect } from "react";
import { useRecoilState } from "recoil";
import { userLocationState } from "@/store/location/atoms";
import { supabase } from "@/lib/supabase";
import { Address } from "@/types/supabase";
import { useAuth } from "@/hooks/auth/useAuth";

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

export const useCountrySelection = () => {
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

  return {
    open,
    setOpen,
    selectedCountry,
    setSelectedCountry,
    selectionComplete,
    handleSelectCountry,
    AVAILABLE_COUNTRIES
  };
};
