
import React, { useEffect, useRef } from "react";
import { createMapboxMinimap, loadMapboxSearchSDK } from "@/services/address-service";
import { Loader2 } from "lucide-react";

interface MapboxMinimapProps {
  feature?: any;
  className?: string;
  height?: string;
  onLocationChange?: (feature: any) => void;
}

const MapboxMinimap = ({
  feature,
  className = "",
  height = "200px",
  onLocationChange
}: MapboxMinimapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeMinimap = async () => {
      try {
        await loadMapboxSearchSDK();
        
        if (!mounted || !containerRef.current) return;
        
        // Clear any existing content
        containerRef.current.innerHTML = '';
        
        // Create the minimap
        const minimap = createMapboxMinimap(feature);
        minimapRef.current = minimap;
        
        if (minimap) {
          containerRef.current.appendChild(minimap);
          
          // Add event listener for location change
          if (onLocationChange) {
            minimap.addEventListener('change', (event: any) => {
              if (event.detail?.feature) {
                onLocationChange(event.detail.feature);
              }
            });
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing Mapbox Minimap:", error);
        setIsLoading(false);
      }
    };

    initializeMinimap();

    return () => {
      mounted = false;
      // Clean up the minimap instance
      if (minimapRef.current) {
        try {
          minimapRef.current.remove();
        } catch (e) {
          console.error("Error removing minimap:", e);
        }
      }
    };
  }, []);

  // Update feature when it changes
  useEffect(() => {
    if (minimapRef.current && feature) {
      minimapRef.current.feature = feature;
    }
  }, [feature]);

  return (
    <div 
      className={`border rounded-md overflow-hidden relative ${className}`}
      style={{ height }}
    >
      <div 
        ref={containerRef}
        className="w-full h-full"
      ></div>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
};

export default MapboxMinimap;
