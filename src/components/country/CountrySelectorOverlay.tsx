
import React from "react";

interface CountrySelectorOverlayProps {
  open: boolean;
}

const CountrySelectorOverlay = ({ open }: CountrySelectorOverlayProps) => {
  if (!open) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100000]" 
      style={{ 
        pointerEvents: "all",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 1,
        transition: "opacity 150ms ease-in-out"
      }}
    />
  );
};

export default CountrySelectorOverlay;
