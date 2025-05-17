
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface SimplifiedMapUpdaterProps {
  coordinates: { lat: number; lon: number } | null;
  onMapReady: (map?: L.Map) => void;
}

export const SimplifiedMapUpdater: React.FC<SimplifiedMapUpdaterProps> = ({ 
  coordinates,
  onMapReady
}) => {
  const map = useMap();
  const initCompletedRef = useRef(false);
  
  // Primary initialization effect - runs once when map is first mounted
  useEffect(() => {
    if (!map || initCompletedRef.current) return;
    
    console.log('SimplifiedMapUpdater: Starting initialization');
    
    try {
      // CRITICAL: COMPLETELY remove ALL touch functionality to prevent "a is not a function" error
      if (map.options) {
        // Disable all interactive touch options
        map.options.touchZoom = false;
        map.options.tap = false;
        map.options.dragging = !L.Browser.mobile; // Disable dragging on mobile
        map.options.keyboard = false; // Disable keyboard navigation
        map.options.inertia = !L.Browser.mobile; // Disable inertia on mobile
        map.options.zoomAnimation = !L.Browser.mobile; // Disable zoom animation on mobile
        map.options.fadeAnimation = !L.Browser.mobile; // Disable fade animation on mobile
        map.options.doubleClickZoom = false; // Disable double click zoom
        
        // Try to directly disable handlers
        if (map._handlers) {
          // Disable all handlers with names containing 'touch', 'tap', or 'drag'
          Object.keys(map._handlers).forEach(handlerId => {
            try {
              if (handlerId.includes('touch') || handlerId.includes('tap') || handlerId.includes('drag')) {
                map._handlers[handlerId].disable();
                console.log(`Disabled handler: ${handlerId}`);
              }
            } catch (e) {
              // Ignore any errors from disabling handlers
            }
          });
        }
        
        // Try to completely remove problematic event handlers from the map container
        if (typeof window !== 'undefined' && map._container) {
          try {
            const touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'tap', 'taphold', 'dbltap'];
            
            // First try to remove all event listeners
            const el = map._container;
            const clone = el.cloneNode(true);
            if (el.parentNode) {
              el.parentNode.replaceChild(clone, el);
              map._container = clone;
            }
            
            // Prevent all touch events on the container
            touchEvents.forEach(event => {
              map._container.addEventListener(event, (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }, { capture: true });
            });
            
            // Add inline style to disable touch actions
            map._container.style.touchAction = 'none';
          } catch (e) {
            // Ignore errors from event handler manipulation
          }
        }
      }
      
      // For mobile, patch in a static, non-interactive map behavior
      const isMobile = L.Browser.mobile || 
        (typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      
      if (isMobile) {
        // Make the map essentially static on mobile
        try {
          // Disable ALL interaction methods
          if (map.dragging) map.dragging.disable();
          if (map.touchZoom) map.touchZoom.disable();
          if (map.doubleClickZoom) map.doubleClickZoom.disable();
          if (map.scrollWheelZoom) map.scrollWheelZoom.disable();
          if (map.boxZoom) map.boxZoom.disable();
          if (map.keyboard) map.keyboard.disable();
          if (map.tap) map.tap.disable();
          
          // Remove all event listeners from the container
          if (map._container) {
            const clone = map._container.cloneNode(true);
            if (map._container.parentNode) {
              map._container.parentNode.replaceChild(clone, map._container);
              map._container = clone;
            }
          }
          
          console.log('Disabled all interactive features on mobile');
        } catch (e) {
          console.warn('Error disabling map interactions:', e);
        }
      }
      
      // Notify parent that the map is ready
      console.log('SimplifiedMapUpdater: Map ready, notifying parent');
      initCompletedRef.current = true;
      onMapReady(map);
      
      // Force resize after a slight delay
      setTimeout(() => {
        if (map) {
          map.invalidateSize(true);
        }
      }, 100);
      
    } catch (error) {
      console.error('Error during map initialization:', error);
      // Ensure we always call onMapReady even if there's an error
      if (!initCompletedRef.current) {
        initCompletedRef.current = true;
        onMapReady(); 
      }
    }
    
    // No cleanup needed for touch handler disabling
  }, [map, onMapReady]);
  
  // Secondary effect to handle coordinate changes after initialization
  useEffect(() => {
    if (!map || !coordinates || !initCompletedRef.current) return;
    
    try {
      console.log('SimplifiedMapUpdater: Updating map view for new coordinates');
      map.invalidateSize(true);
      map.setView([coordinates.lat, coordinates.lon], 13);
    } catch (error) {
      console.error('Error updating map view:', error);
    }
  }, [map, coordinates]);
  
  return null;
};
