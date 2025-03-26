
import React, { useEffect } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesGrid } from "@/components/home/FeaturesGrid";
import { StatsSection } from "@/components/home/StatsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import GetStartedSteps from "@/components/home/GetStartedSteps";
import { PartnerSection } from "@/components/home/PartnerSection";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CountrySelector from "@/components/CountrySelector";

export default function Index() {
  // Add logging to help debug
  useEffect(() => {
    console.log("Index page mounted");
    
    try {
      // Force clearing the country selection on initial Index page mount
      localStorage.removeItem('selectedCountry');
      console.log("Index: Successfully cleared selectedCountry from localStorage");
    } catch (e) {
      console.error("Error clearing localStorage:", e);
    }
  }, []);

  // Log when components are about to render
  console.log("Index page rendering components");

  return (
    <>
      <Header />
      <CountrySelector />
      <HeroSection />
      <div className="container mx-auto px-4">
        <FeaturesGrid />
        <GetStartedSteps />
      </div>
      <StatsSection />
      <div className="container mx-auto px-4">
        <TestimonialsSection />
      </div>
      <PartnerSection />
      <Footer />
    </>
  );
}
