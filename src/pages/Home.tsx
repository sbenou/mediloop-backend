
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

const Home = () => {
  const navigate = useNavigate();
  
  // Add detailed logging to help debug
  useEffect(() => {
    console.log("Home page mounted - debugging blank page issue");
    document.title = "Home - MediLoop";
    
    // Log window dimensions
    console.log("Window dimensions:", {
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, []);

  // Log outside the JSX
  console.log("Rendering Home JSX");
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Debug element - highly visible */}
      <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-2 z-[9999] text-center">
        Debug: If you see this, the Home component is rendering
      </div>
      
      <CurrencyProvider>
        <CartProvider>
          <UnifiedHeader />
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
