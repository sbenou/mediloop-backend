
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import Footer from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesGrid } from '@/components/home/FeaturesGrid';
import { StatsSection } from '@/components/home/StatsSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import GetStartedSteps from '@/components/home/GetStartedSteps';
import { PartnerSection } from '@/components/home/PartnerSection';
import { DeliveryPersonSection } from '@/components/home/DeliveryPersonSection';
import { CartProvider } from '@/contexts/CartContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { ScrollToTopButton } from '@/components/ui/scroll-to-top';
import { CookieConsent } from '@/components/cookies/CookieConsent';
import CountrySelector from '@/components/CountrySelector';

const Home = () => {
  const navigate = useNavigate();
  
  // Add detailed logging to help debug
  useEffect(() => {
    console.log("Home page mounted");
    console.log("Current URL:", window.location.href);
    
    // Make sure we can see components rendering
    console.log("Rendering Home component with all sections");
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <CurrencyProvider>
        <CartProvider>
          <UnifiedHeader />
          <CountrySelector />
          <main className="flex-1">
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
            <DeliveryPersonSection />
          </main>
          <Footer />
          <ScrollToTopButton />
          <CookieConsent />
        </CartProvider>
      </CurrencyProvider>
    </div>
  );
};

export default Home;
