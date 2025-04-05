
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
import { CookieConsent } from "@/components/cookies/CookieConsent";
import { CartProvider } from '@/contexts/CartContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { ScrollToTopButton } from "@/components/ui/scroll-to-top";

export default function Index() {
  // Add detailed logging to help debug
  useEffect(() => {
    console.log("Index page mounted");
    console.log("Current URL:", window.location.href);
    
    // We're removing the forced clearing of country selection
    // to respect user's previous selection
  }, []);

  // Log when components are about to render
  console.log("Index page rendering components");

  return (
    <CurrencyProvider>
      <CartProvider>
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
          <CookieConsent />
          <ScrollToTopButton />
        </>
      </CartProvider>
    </CurrencyProvider>
  );
}
