
import React from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesGrid } from "@/components/home/FeaturesGrid";
import { StatsSection } from "@/components/home/StatsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { GetStartedSteps } from "@/components/home/GetStartedSteps";
import { PartnerSection } from "@/components/home/PartnerSection";

export default function Index() {
  return (
    <div className="container mx-auto px-4">
      <HeroSection />
      <FeaturesGrid />
      <StatsSection />
      <TestimonialsSection />
      <GetStartedSteps />
      <PartnerSection />
      <SessionDebugButton />
    </div>
  );
}

// Debug button component for development environments
function SessionDebugButton() {
  const isLocalDev = process.env.NODE_ENV === 'development';
  
  if (!isLocalDev) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={() => {
          // This uses the function we added to window in supabase.ts
          if ((window as any).clearAllSupabaseStorage) {
            (window as any).clearAllSupabaseStorage();
            alert('All Supabase storage cleared. Reload the page to see effects.');
          } else {
            alert('clearAllSupabaseStorage function not found');
          }
        }}
        className="bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700"
      >
        Clear Auth Storage
      </button>
    </div>
  );
}
