
/// <reference types="vite/client" />

declare module 'leaflet-draw' {
  export = L;
}

declare module 'react-leaflet' {
  import { FC, ReactNode, RefAttributes, Ref } from 'react';
  import L from 'leaflet';

  export interface MapContainerProps {
    center: [number, number];
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
    position: [number, number];
    children?: ReactNode;
    key?: string;
    eventHandlers?: {
      click?: () => void;
      mouseover?: () => void;
      mouseout?: () => void;
      [key: string]: (() => void) | undefined;
    };
    icon?: L.Icon;
    ref?: Ref<L.Marker>;
  }

  export interface PopupProps {
    children?: ReactNode;
  }

  export const MapContainer: FC<MapContainerProps>;
  export const TileLayer: FC<TileLayerProps>;
  export const Marker: FC<MarkerProps>;
  export const Popup: FC<PopupProps>;
  export const useMap: () => L.Map;
}
