
/// <reference types="vite/client" />

declare module 'leaflet-draw' {
  import L from 'leaflet';
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
  }

  export interface TileLayerProps {
    attribution?: string;
    url: string;
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
  }

  // Export component types
  export const MapContainer: React.FC<MapContainerProps>;
  export const TileLayer: React.FC<TileLayerProps>;
  export const Marker: React.FC<MarkerProps>;
  export const Popup: React.FC<PopupProps>;
  
  // Hook to access the map instance
  export function useMap(): L.Map;
}
