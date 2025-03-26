
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesGrid } from '@/components/home/FeaturesGrid';

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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesGrid />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
