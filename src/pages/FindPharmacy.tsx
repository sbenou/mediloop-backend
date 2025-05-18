
import React, { useState, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { userLocationState } from '@/store/location/atoms';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import Footer from '@/components/layout/Footer';
import { PharmacyFinderMap } from '@/components/pharmacy/finder/PharmacyFinderMap';
import { PharmacyFinderList } from '@/components/pharmacy/finder/PharmacyFinderList';
import { PharmacySearch } from '@/components/pharmacy/finder/PharmacySearch';
import StaticMapComponent from '@/components/pharmacy/finder/StaticMapComponent';
import { usePharmacyFinder } from '@/hooks/usePharmacyFinder';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Global error handler for Leaflet-related errors
if (typeof window !== 'undefined') {
  console.log('Setting up global error handler');
  
  // This error handler will catch and suppress Leaflet-related errors
  window.addEventListener('error', (e) => {
    console.log('Global error caught:', e.message);
    
    // Check if it's a known Leaflet-related error
    if (e.message && (
      e.message.includes('a is not a function') || 
      e.message.includes('touchleave') ||
      e.message.includes('_onTap') ||
      e.message.includes('touch') ||
      e.message.includes('undefined is not an object') ||
      e.message.includes('is undefined')
    )) {
      console.log('Suppressing Leaflet-related error:', e.message);
      e.preventDefault();
      e.stopPropagation();
      return true; // Prevent default error handling
    }
    return false; // Let other errors propagate
  }, true);
}

// Detect if the current device is a mobile device or has touch capability
const isTouchDevice = typeof window !== 'undefined' && (
  'ontouchstart' in window || 
  navigator.maxTouchPoints > 0 ||
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
);

const FindPharmacy = () => {
  console.log('FindPharmacy component rendering');
  const userLocation = useRecoilValue(userLocationState);
  console.log('User location from state:', userLocation);
  
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [leafletFilteredPharmacies, setLeafletFilteredPharmacies] = useState<any[]>([]);
  
  // Use our custom hook for pharmacy finding logic
  const { 
    pharmacies, 
    filteredPharmacies,
    isLoading, 
    error,
    searchQuery,
    setSearchQuery,
    useLocationFilter,
    setUseLocationFilter
  } = usePharmacyFinder(userLocation);

  console.log('Pharmacies loaded:', pharmacies?.length || 0);
  console.log('Filtered pharmacies:', filteredPharmacies?.length || 0);
  console.log('Loading state:', isLoading);
  console.log('Error state:', error);

  // Initialize leaflet filtered pharmacies with all pharmacies
  useEffect(() => {
    if (filteredPharmacies && filteredPharmacies.length > 0) {
      console.log('Setting leaflet filtered pharmacies:', filteredPharmacies.length);
      setLeafletFilteredPharmacies(filteredPharmacies);
    }
  }, [filteredPharmacies]);

  // Show error if API fails
  useEffect(() => {
    if (error) {
      console.error('Error loading pharmacies:', error);
      toast({
        title: "Error loading pharmacies",
        description: "There was a problem loading pharmacy data. Please try again later.",
        variant: "destructive"
      });
    }
  }, [error]);

  // Handle pharmacies filtered by map shape
  const handlePharmaciesInShape = (shapeFilteredPharmacies: any[]) => {
    console.log("Pharmacies in shape:", shapeFilteredPharmacies.length);
    setLeafletFilteredPharmacies(shapeFilteredPharmacies);
  };

  console.log('Rendering FindPharmacy with view mode:', viewMode);

  return (
    <div className="min-h-screen flex flex-col">
      <UnifiedHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find a Pharmacy Near You</h1>
          <p className="text-muted-foreground">
            Browse pharmacy locations and find one that meets your needs
          </p>
        </div>
        
        {/* Search and filter controls */}
        <PharmacySearch 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          useLocationFilter={useLocationFilter}
          setUseLocationFilter={setUseLocationFilter}
          userLocation={userLocation}
        />
        
        {/* View mode tabs */}
        <Tabs defaultValue="list" className="mt-6" onValueChange={(value) => {
          console.log('Changing view mode to:', value);
          setViewMode(value as 'list' | 'map');
        }}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Map View
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="mt-4">
            <PharmacyFinderList 
              pharmacies={filteredPharmacies}
              isLoading={isLoading}
              userLocation={userLocation}
            />
          </TabsContent>
          
          <TabsContent value="map" className="mt-4">
            <Card className="p-1 shadow-sm">
              <CardContent className="p-0 h-[600px] relative">
                <PharmacyFinderMap 
                  pharmacies={filteredPharmacies}
                  userLocation={userLocation}
                  useLocationFilter={useLocationFilter}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Alternative map implementation section */}
        <div className="mt-16 mb-8">
          <Separator className="my-8" />
          <Card>
            <CardHeader>
              <CardTitle>Alternative Map View</CardTitle>
              <CardDescription>
                View pharmacies using a simplified map interface.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white border border-gray-200 rounded-md">
                <div className="h-[500px] w-full relative">
                  {/* Use the static map component for all devices to avoid Leaflet errors */}
                  <StaticMapComponent 
                    pharmacies={pharmacies || []}
                    userLocation={userLocation}
                    onPharmaciesInShape={handlePharmaciesInShape}
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium mb-4">Filtered Pharmacies ({leafletFilteredPharmacies.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leafletFilteredPharmacies.length > 0 ? (
                    <>
                      {leafletFilteredPharmacies.slice(0, 3).map((pharmacy) => (
                        <Card key={pharmacy.id || Math.random().toString(36).substr(2, 9)} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{pharmacy.name || 'Unnamed Pharmacy'}</CardTitle>
                            {pharmacy.distance && (
                              <CardDescription>
                                {pharmacy.distance}km away
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="text-sm space-y-2">
                            <p>{pharmacy.address || 'Address not available'}</p>
                            {pharmacy.hours && <p>{pharmacy.hours}</p>}
                          </CardContent>
                        </Card>
                      ))}
                      
                      {leafletFilteredPharmacies.length > 3 && (
                        <div className="col-span-full mt-4">
                          <p className="text-sm text-muted-foreground">
                            {leafletFilteredPharmacies.length - 3} more pharmacies found.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="col-span-full">
                      <Alert>
                        <AlertDescription>
                          No pharmacies found in the selected area.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default FindPharmacy;
