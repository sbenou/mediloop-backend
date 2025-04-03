
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  performance: boolean;
}

const defaultPreferences: CookiePreferences = {
  necessary: true, // Always true and disabled
  functional: false,
  performance: false,
};

interface CookieSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CookieSettings({ open, onOpenChange }: CookieSettingsProps) {
  const [preferences, setPreferences] = useLocalStorage<CookiePreferences>(
    "cookie-preferences",
    defaultPreferences
  );

  const handleSave = () => {
    // In a real app, this would save the cookie preferences and apply them
    // For now, we just close the drawer
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] bg-[#7E69AB] text-white">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle className="text-center text-xl text-white">Cookie Settings</DrawerTitle>
            <p className="text-center text-white/80">
              Manage your cookie settings here.
            </p>
          </DrawerHeader>
          
          <div className="px-4 py-2 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="necessary-cookies" className="font-medium text-white">Strictly Necessary</Label>
                <p className="text-sm text-white/70">
                  These cookies are essential in order to use the website and use its features.
                </p>
              </div>
              <Switch 
                id="necessary-cookies" 
                checked={preferences.necessary} 
                disabled={true} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="functional-cookies" className="font-medium text-white">Functional Cookies</Label>
                <p className="text-sm text-white/70">
                  These cookies allow the website to provide personalized functionality.
                </p>
              </div>
              <Switch 
                id="functional-cookies" 
                checked={preferences.functional} 
                onCheckedChange={(checked) => 
                  setPreferences({...preferences, functional: checked})
                } 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="performance-cookies" className="font-medium text-white">Performance Cookies</Label>
                <p className="text-sm text-white/70">
                  These cookies help to improve the performance of the website.
                </p>
              </div>
              <Switch 
                id="performance-cookies" 
                checked={preferences.performance} 
                onCheckedChange={(checked) => 
                  setPreferences({...preferences, performance: checked})
                } 
              />
            </div>
          </div>
          
          <DrawerFooter>
            <Button 
              onClick={handleSave}
              className="w-full bg-white text-[#7E69AB] hover:bg-white/90"
            >
              Save preferences
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
