
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import Footer from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesGrid } from '@/components/home/FeaturesGrid';
import { CartProvider } from '@/contexts/CartContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { ScrollToTopButton } from '@/components/ui/scroll-to-top';
import { CookieConsent } from '@/components/cookies/CookieConsent';

const Home = () => {
  const navigate = useNavigate();
  
  // Add detailed logging to help debug
  useEffect(() => {
    console.log("Home page mounted");
    console.log("Current URL:", window.location.href);
  }, []);

  // Log when components are about to render
  console.log("Home page rendering components");

  return (
    <CurrencyProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          <UnifiedHeader />
          <main className="flex-1">
            <HeroSection />
            <FeaturesGrid />
          </main>
          <Footer />
          <ScrollToTopButton />
          <CookieConsent />
        </div>
      </CartProvider>
    </CurrencyProvider>
  );
};

export default Home;
