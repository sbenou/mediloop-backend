
import { useState, useEffect, useRef, useMemo } from "react";
import { Card } from "@/components/ui/card";
import DoctorCard from "@/components/doctor/DoctorCard";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { cn } from "@/lib/utils";
import { SimplifiedMapUpdater } from "@/components/pharmacy/map/SimplifiedMapUpdater";

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a custom red icon for user location
const userLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Create larger icon for selected marker
const selectedIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [31, 51],
  iconAnchor: [15, 51],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Default icon for non-selected markers
const defaultIcon = new L.Icon.Default();

interface Doctor {
  id: string;
  full_name: string;
  city: string | null;
  license_number: string;
  email?: string;
  hours?: string;
  source?: 'database' | 'overpass';
  coordinates?: {
    lat: number;
    lon: number;
  };
}

interface DoctorListSectionProps {
  doctors: Doctor[];
  isLoading: boolean;
  coordinates: { lat: number; lon: number };
  onConnect: (doctorId: string, source: 'database' | 'overpass') => void;
  showUserLocation?: boolean;
}

const DoctorListSection = ({
  doctors,
  isLoading,
  coordinates,
  onConnect,
  showUserLocation = false
}: DoctorListSectionProps) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const listItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapInitError, setMapInitError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(`map-${Date.now()}`);
  const [retryCount, setRetryCount] = useState(0);

  // Default coordinates (Luxembourg)
  const defaultLat = 49.8153;
  const defaultLon = 6.1296;
  
  // Use valid coordinates or fallback to defaults
  const centerPosition = useMemo<LatLngExpression>(() => {
    if (coordinates && 
        typeof coordinates.lat === 'number' && !isNaN(coordinates.lat) &&
        typeof coordinates.lon === 'number' && !isNaN(coordinates.lon)) {
      return [coordinates.lat, coordinates.lon];
    }
    return [defaultLat, defaultLon];
  }, [coordinates]);

  // Ensure doctors is an array with robust error handling
  const validDoctors = useMemo(() => {
    try {
      return Array.isArray(doctors) ? doctors : [];
    } catch (error) {
      console.error("Error processing doctors data:", error);
      return [];
    }
  }, [doctors]);
  
  // Filter out doctors with invalid coordinates
  const doctorsWithValidCoordinates = useMemo(() => {
    try {
      if (!Array.isArray(validDoctors)) return [];
      
      return validDoctors.filter(doctor => {
        if (!doctor || !doctor.coordinates) return false;
        
        const lat = doctor.coordinates.lat;
        const lon = doctor.coordinates.lon;
        
        return (typeof lat === 'number' && !isNaN(lat) && 
                typeof lon === 'number' && !isNaN(lon));
      });
    } catch (error) {
      console.error("Error filtering doctors with coordinates:", error);
      return [];
    }
  }, [validDoctors]);
  
  const handleDoctorSelect = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    
    // Scroll the selected doctor into view in the list
    if (listItemRefs.current[doctorId]) {
      listItemRefs.current[doctorId]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  };
  
  // Handle map initialization errors
  useEffect(() => {
    const handleMapError = (event: ErrorEvent) => {
      if (event.message.includes('a is not a function')) {
        console.error('Caught map initialization error:', event);
        setMapInitError('Map initialization error. Please try refreshing the page.');
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
      return false;
    };
    
    window.addEventListener('error', handleMapError);
    
    return () => {
      window.removeEventListener('error', handleMapError);
    };
  }, []);

  // Auto-retry logic for map errors
  useEffect(() => {
    if (mapInitError && retryCount < 2) {
      const timer = setTimeout(() => {
        console.log(`Auto-retrying map initialization (attempt ${retryCount + 1})...`);
        setMapKey(`map-retry-${Date.now()}`);
        setMapInitError(null);
        setRetryCount(prev => prev + 1);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [mapInitError, retryCount]);

  // Handle map ready callback
  const handleMapReady = () => {
    console.log("Map is ready");
    setIsMapReady(true);
  };

  return (
    <div className="mt-24 grid grid-cols-1 lg:grid-cols-[400px,1fr] gap-6 h-[calc(100vh-200px)]">
      {/* Doctor list section */}
      <div className="overflow-y-auto space-y-4 pr-4 relative z-50">
        {isLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </Card>
            ))}
          </>
        )}

        {validDoctors.length > 0 && validDoctors.map((doctor) => (
          <div
            key={doctor.id}
            ref={(el) => listItemRefs.current[doctor.id] = el}
            onClick={() => handleDoctorSelect(doctor.id)}
            className={cn(
              "transition-all duration-200",
              selectedDoctorId === doctor.id && "scale-[1.02]"
            )}
          >
            <DoctorCard
              {...doctor}
              city={doctor.city || 'Unknown location'}
              onConnect={() => onConnect(doctor.id, doctor.source || 'database')}
              isSelected={selectedDoctorId === doctor.id}
            />
          </div>
        ))}

        {validDoctors.length === 0 && !isLoading && (
          <p className="text-center text-gray-500">No doctors found in this area</p>
        )}
      </div>

      {/* Map section */}
      <div className="rounded-lg overflow-hidden border border-gray-200 h-full relative z-10">
        {/* Loading indicator */}
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-0">
          <p className="text-gray-500">Loading map...</p>
        </div>
        
        {/* Error message for map initialization failures */}
        {mapInitError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
              <h3 className="text-lg font-medium text-red-600 mb-2">Map Error</h3>
              <p className="text-sm text-gray-600 mb-4">{mapInitError}</p>
              <button 
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                onClick={() => {
                  setMapKey(`map-manual-retry-${Date.now()}`);
                  setMapInitError(null);
                }}
              >
                Retry Loading Map
              </button>
            </div>
          </div>
        )}
        
        {/* Render map only when we have valid data and no error */}
        {!mapInitError && (
          <div className="h-full w-full relative z-1">
            <div id="doctor-map-container" className="h-full w-full">
              <MapContainer
                key={mapKey}
                center={centerPosition}
                zoom={12}
                style={{ 
                  height: '100%', 
                  width: '100%', 
                  position: 'relative', 
                  zIndex: 1 
                }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Use SimplifiedMapUpdater to handle map events and readiness */}
                <SimplifiedMapUpdater 
                  coordinates={coordinates}
                  onMapReady={handleMapReady} 
                />
                
                {/* Show user location marker if enabled */}
                {showUserLocation && (
                  <Marker 
                    position={centerPosition} 
                    icon={userLocationIcon}
                  >
                    <Popup>Your location</Popup>
                  </Marker>
                )}

                {/* Show doctor location markers */}
                {isMapReady && doctorsWithValidCoordinates.map((doctor) => {
                  if (!doctor.coordinates) return null;
                  
                  // Ensure coordinates are valid numbers
                  const docLat = doctor.coordinates?.lat;
                  const docLon = doctor.coordinates?.lon;
                  
                  if (typeof docLat !== 'number' || typeof docLon !== 'number' || 
                      isNaN(docLat) || isNaN(docLon)) {
                    return null;
                  }
                  
                  const position: LatLngExpression = [docLat, docLon];
                  
                  return (
                    <Marker
                      key={doctor.id}
                      position={position}
                      icon={selectedDoctorId === doctor.id ? selectedIcon : defaultIcon}
                      eventHandlers={{
                        click: () => handleDoctorSelect(doctor.id)
                      }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <p className="font-semibold">{doctor.full_name}</p>
                          <p>{doctor.city || 'Unknown location'}</p>
                          <p>{doctor.license_number}</p>
                          {doctor.hours && <p>{doctor.hours}</p>}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorListSection;
