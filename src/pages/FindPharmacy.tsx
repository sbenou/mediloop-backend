
import React, { useState, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { userLocationState } from '@/store/location/atoms';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import Footer from '@/components/layout/Footer';
import { PharmacyFinderMap } from '@/components/pharmacy/finder/PharmacyFinderMap';
import { PharmacyFinderList } from '@/components/pharmacy/finder/PharmacyFinderList';
import { PharmacySearch } from '@/components/pharmacy/finder/PharmacySearch';
import LeafletPharmacyMap from '@/components/pharmacy/finder/LeafletPharmacyMap';
import { usePharmacyFinder } from '@/hooks/usePharmacyFinder';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Search } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

const FindPharmacy = () => {
  const userLocation = useRecoilValue(userLocationState);
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

  // Initialize leaflet filtered pharmacies with all pharmacies
  useEffect(() => {
    if (filteredPharmacies && filteredPharmacies.length > 0) {
      setLeafletFilteredPharmacies(filteredPharmacies);
    }
  }, [filteredPharmacies]);

  // Show error if API fails
  useEffect(() => {
    if (error) {
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
        <Tabs defaultValue="list" className="mt-6" onValueChange={(value) => setViewMode(value as 'list' | 'map')}>
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

        {/* React-Leaflet implementation section */}
        <div className="mt-16 mb-8">
          <Separator className="my-8" />
          <Card>
            <CardHeader>
              <CardTitle>Alternative Map Implementation</CardTitle>
              <CardDescription>
                Try drawing shapes on the map to filter pharmacies within a specific area.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white">
                <LeafletPharmacyMap 
                  pharmacies={pharmacies || []}
                  userLocation={userLocation}
                  useLocationFilter={useLocationFilter}
                  onPharmaciesInShape={handlePharmaciesInShape}
                />
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
                            {leafletFilteredPharmacies.length - 3} more pharmacies found in the selected area.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="col-span-full">
                      <Alert>
                        <AlertDescription>
                          Draw a shape on the map to filter pharmacies in that area.
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
