
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { CookieSettings } from "./CookieSettings";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cookieConsent, setCookieConsent] = useLocalStorage<boolean | null>("cookie-consent", null);
  
  // Show the banner if consent hasn't been given yet
  useEffect(() => {
    // Short delay to prevent banner flashing on page load if consent is already given
    const timer = setTimeout(() => {
      setShowBanner(cookieConsent === null);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [cookieConsent]);
  
  const acceptAll = () => {
    setCookieConsent(true);
    setShowBanner(false);
    
    // Set all cookies to true
    const allAccepted = {
      necessary: true,
      functional: true,
      performance: true
    };
    
    localStorage.setItem("cookie-preferences", JSON.stringify(allAccepted));
  };
  
  const rejectNonEssential = () => {
    setCookieConsent(true);
    setShowBanner(false);
    
    // Only set necessary cookies to true
    const onlyNecessary = {
      necessary: true,
      functional: false,
      performance: false
    };
    
    localStorage.setItem("cookie-preferences", JSON.stringify(onlyNecessary));
  };
  
  if (!showBanner && !showSettings) {
    return null;
  }
  
  return (
    <>
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg md:flex md:items-center md:justify-between">
          <div className="mb-4 md:mb-0 md:mr-4">
            <h3 className="text-lg font-semibold">We use cookies</h3>
            <p className="max-w-3xl text-sm text-muted-foreground">
              This website uses cookies to enhance your browsing experience. You can choose which cookies you want to accept.
            </p>
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowBanner(false);
                setShowSettings(true);
              }}
            >
              Cookie settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={rejectNonEssential}
            >
              Reject non-essential
            </Button>
            <Button
              size="sm"
              onClick={acceptAll}
              className="bg-[#7E69AB] hover:bg-[#6E59A5]"
            >
              Accept all
            </Button>
          </div>
        </div>
      )}
      
      <CookieSettings 
        open={showSettings} 
        onOpenChange={(open) => setShowSettings(open)} 
      />
    </>
  );
}
