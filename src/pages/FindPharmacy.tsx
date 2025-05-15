
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
import { MapPin, Search, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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
    setLeafletFilteredPharmacies(filteredPharmacies);
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
            <div className="bg-card rounded-lg border shadow-sm p-1" style={{ height: "600px" }}>
              <PharmacyFinderMap 
                pharmacies={filteredPharmacies}
                userLocation={userLocation}
                useLocationFilter={useLocationFilter}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* React-Leaflet implementation comparison section */}
        <div className="mt-16 mb-8">
          <Separator className="my-8" />
          <Card>
            <CardHeader>
              <CardTitle>React-Leaflet Implementation</CardTitle>
              <CardDescription>
                This is an alternative implementation using React-Leaflet. Try drawing shapes on the map to filter pharmacies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeafletPharmacyMap 
                pharmacies={pharmacies}
                userLocation={userLocation}
                useLocationFilter={useLocationFilter}
                onPharmaciesInShape={setLeafletFilteredPharmacies}
              />
              
              <div className="mt-6">
                <h3 className="font-medium mb-4">Filtered Pharmacies ({leafletFilteredPharmacies.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leafletFilteredPharmacies.slice(0, 3).map((pharmacy) => (
                    <Card key={pharmacy.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{pharmacy.name}</CardTitle>
                        {pharmacy.distance && (
                          <CardDescription>
                            {pharmacy.distance}km away
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <p>{pharmacy.address}</p>
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
