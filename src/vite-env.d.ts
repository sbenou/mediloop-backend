
/// <reference types="vite/client" />

declare module 'leaflet-draw' {
  import L from 'leaflet';
  
  namespace L {
    namespace Draw {
      namespace Event {
        const CREATED: string;
        const EDITED: string;
        const DELETED: string;
        const DRAWSTART: string;
        const DRAWSTOP: string;
        const DRAWVERTEX: string;
        const EDITSTART: string;
        const EDITMOVE: string;
        const EDITRESIZE: string;
        const EDITVERTEX: string;
        const EDITSTOP: string;
        const DELETESTART: string;
        const DELETESTOP: string;
      }
    }
    
    namespace control {
      interface DrawConstructorOptions {
        edit?: {
          featureGroup: L.FeatureGroup;
          poly?: {
            allowIntersection?: boolean;
          };
          remove?: boolean;
        };
        draw?: {
          polyline?: object | boolean;
          polygon?: object | boolean;
          rectangle?: object | boolean;
          circle?: object | boolean;
          marker?: object | boolean;
          circlemarker?: object | boolean;
        };
      }
    }
    
    class Control {
      static Draw: new (options?: control.DrawConstructorOptions) => Control.Draw;
    }
    
    namespace Control {
      class Draw extends L.Control {
        constructor(options?: control.DrawConstructorOptions);
      }
    }
  }
  
  export = L;
}

declare module 'react-leaflet' {
  import { ReactNode } from 'react';
  import L from 'leaflet';

  // Define interfaces for React Leaflet components
  export interface MapContainerProps {
    center: L.LatLngExpression;
    zoom: number;
    scrollWheelZoom?: boolean;
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
    key?: string;
    whenCreated?: (map: L.Map) => void;
  }

  export interface TileLayerProps {
    attribution?: string;
    url: string;
    key?: string;
  }

  export interface MarkerProps {
    position: L.LatLngExpression;
    children?: ReactNode;
    key?: string;
    icon?: L.Icon;
    eventHandlers?: {
      click?: () => void;
      mouseover?: () => void;
      mouseout?: () => void;
    };
  }

  export interface PopupProps {
    children?: ReactNode;
    key?: string;
  }

  // Export component types
  export const MapContainer: React.FC<MapContainerProps>;
  export const TileLayer: React.FC<TileLayerProps>;
  export const Marker: React.FC<MarkerProps>;
  export const Popup: React.FC<PopupProps>;
  
  // Hook to access the map instance
  export function useMap(): L.Map;

  // MapEvents interface renamed to avoid conflicts
  export interface LeafletMapEvents {
    click?: (e: L.LeafletMouseEvent) => void;
    zoom?: (e: L.LeafletEvent) => void;
    moveend?: (e: L.LeafletEvent) => void;
    load?: (e: L.LeafletEvent) => void;
  }
}
