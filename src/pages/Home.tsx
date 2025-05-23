
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
    console.log("Home page mounted - debugging blank page issue");
    console.log("Current URL:", window.location.href);
    console.log("Starting to render Home sections");
    
    // Force a re-render after a short delay to see if that helps
    const timer = setTimeout(() => {
      console.log("Forcing re-render of Home component");
      // This will trigger a re-render
      navigate('/', { replace: true });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  // Log outside the JSX
  console.log("Rendering Home JSX");
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
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
