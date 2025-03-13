import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import { useAuth } from '@/hooks/auth/useAuth';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { SimplifiedMapUpdater } from '@/components/pharmacy/map/SimplifiedMapUpdater';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a red icon for user location
const userLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to init the draw control
function DrawControl() {
  const map = useMap();
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef(new L.FeatureGroup());
  
  useEffect(() => {
    if (!map) return;

    // Add the FeatureGroup to the map
    map.addLayer(drawnItemsRef.current);

    // Initialize the draw control and pass it the FeatureGroup of editable layers
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItemsRef.current,
        poly: {
          allowIntersection: false
        }
      },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true
        },
        polyline: false,
        rectangle: true,
        circle: true,
        marker: false,
        circlemarker: false
      }
    });

    // Add the draw control to the map
    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    // Handle the created event
    map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      drawnItemsRef.current.addLayer(layer);
      
      // You can perform filtering or other actions here
      console.log('Shape created', layer);
      
      // If you want to get all pharmacies within the drawn shape
      // You would implement that logic here
    });

    // Clean up on component unmount
    return () => {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }
      map.removeLayer(drawnItemsRef.current);
      map.off(L.Draw.Event.CREATED);
    };
  }, [map]);

  return null;
}

// Main page component
const SearchPharmacyTest = () => {
  const [searchQuery, setSearchQuery] = useState('Luxembourg');
  const [showDefaultLocation, setShowDefaultLocation] = useState(false);
  const [filteredPharmacies, setFilteredPharmacies] = useState<any[]>([]);
  const [mapKey, setMapKey] = useState(`map-${Date.now()}`);
  
  const { coordinates: locationCoordinates, handleCitySearch } = useLocationSearch();
  const { profile } = useAuth();
  
  // Default coordinates for Luxembourg
  const defaultCoordinates = { lat: 49.8153, lon: 6.1296 };
  
  // Get current coordinates
  const { data: coordinates } = useQuery({
    queryKey: ['geo-coordinates'],
    queryFn: async () => {
      return locationCoordinates ? 
        { lat: parseFloat(locationCoordinates.lat), lon: parseFloat(locationCoordinates.lon) } : 
        defaultCoordinates;
    },
    enabled: true,
  });
  
  const currentCoordinates = coordinates || defaultCoordinates;
  
  // Fetch pharmacies
  const { data: pharmacies, isLoading } = useQuery({
    queryKey: ['pharmacies'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('pharmacies')
          .select('*');
          
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error fetching pharmacies:', err);
        return [];
      }
    }
  });
  
  // Initialize with default search
  useEffect(() => {
    if (!locationCoordinates) {
      handleCitySearch("Luxembourg");
    }
  }, []);
  
  // Update filtered pharmacies when all pharmacies load
  useEffect(() => {
    if (pharmacies && pharmacies.length > 0) {
      setFilteredPharmacies(pharmacies);
    }
  }, [pharmacies]);
  
  // Force map re-render when coordinates change
  useEffect(() => {
    setMapKey(`map-${Date.now()}`);
  }, [currentCoordinates?.lat, currentCoordinates?.lon]);
  
  // Handle search submission
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    handleCitySearch(searchQuery);
    toast({
      title: "Searching",
      description: `Looking for pharmacies near ${searchQuery}`,
    });
  };
  
  // Handle "Set as Default" for pharmacy
  const handleSetDefault = async (pharmacyId: string) => {
    if (!profile?.id) {
      toast({
        title: "Login Required",
        description: "Please login to set a default pharmacy",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Instead of using RPC, which TypeScript is not recognizing, 
      // use a direct update with proper type handling
      const { error } = await supabase.from('profiles')
        .update({ 
          // Use bracket notation with 'as any' to bypass TypeScript check 
          // since we know 'pharmacy_id' exists in the database
          ['pharmacy_id' as any]: pharmacyId 
        })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      toast({
        title: "Default Pharmacy Set",
        description: "Your default pharmacy has been updated"
      });
    } catch (err) {
      console.error('Error setting default pharmacy:', err);
      toast({
        title: "Error",
        description: "Failed to set default pharmacy",
        variant: "destructive"
      });
    }
  };
  
  // Toggle location usage
  const handleLocationToggle = (checked: boolean) => {
    setShowDefaultLocation(checked);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Find a Pharmacy</h1>
          <div className="flex gap-2 max-w-xl">
            <Input
              placeholder="Enter city or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-grow"
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[350px,1fr] gap-6">
          {/* Pharmacy list */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id="location-toggle"
                checked={showDefaultLocation}
                onCheckedChange={handleLocationToggle}
              />
              <Label htmlFor="location-toggle">
                Use my location
              </Label>
            </div>
            
            <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
              {isLoading ? (
                <p>Loading pharmacies...</p>
              ) : filteredPharmacies.length === 0 ? (
                <p>No pharmacies found</p>
              ) : (
                filteredPharmacies.map((pharmacy) => (
                  <Card key={pharmacy.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">{pharmacy.name}</h3>
                        <p className="text-sm text-gray-500">{pharmacy.address}</p>
                        {pharmacy.phone && (
                          <p className="text-sm">📞 {pharmacy.phone}</p>
                        )}
                        {pharmacy.email && (
                          <p className="text-sm">✉️ {pharmacy.email}</p>
                        )}
                        {pharmacy.hours && (
                          <p className="text-sm">⏰ {pharmacy.hours}</p>
                        )}
                        <div className="pt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSetDefault(pharmacy.id)}
                          >
                            Set as Default
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
          
          {/* Map */}
          <div className="rounded-lg overflow-hidden border border-gray-200 h-[calc(100vh-250px)]">
            <MapContainer
              key={mapKey}
              center={[currentCoordinates.lat, currentCoordinates.lon]}
              zoom={12}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <SimplifiedMapUpdater coordinates={currentCoordinates} />
              <DrawControl />
              
              {/* Render user location marker if using location */}
              {showDefaultLocation && currentCoordinates && (
                <Marker 
                  position={[currentCoordinates.lat, currentCoordinates.lon]}
                  icon={userLocationIcon}
                >
                  <Popup>Your location</Popup>
                </Marker>
              )}
              
              {/* Render pharmacy markers */}
              {filteredPharmacies.map((pharmacy) => {
                if (!pharmacy.coordinates?.lat || !pharmacy.coordinates?.lon) return null;
                
                return (
                  <Marker
                    key={`pharmacy-${pharmacy.id}`}
                    position={[pharmacy.coordinates.lat, pharmacy.coordinates.lon]}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{pharmacy.name || 'Unnamed Pharmacy'}</p>
                        <p>{pharmacy.address || 'Address not available'}</p>
                        <p>{pharmacy.hours || 'Hours not available'}</p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchPharmacyTest;
