
import { useEffect } from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesGrid } from "@/components/home/FeaturesGrid";
import { StatsSection } from "@/components/home/StatsSection";
import GetStartedSteps from "@/components/home/GetStartedSteps";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { PartnerSection } from "@/components/home/PartnerSection";
import { DeliveryPersonSection } from "@/components/home/DeliveryPersonSection";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// The Index page showcases the main landing page
const Index = () => {
  useEffect(() => {
    // Force window resize event to ensure charts and components render correctly
    window.dispatchEvent(new Event('resize'));
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-col gap-20 pb-20">
        <HeroSection />
        <FeaturesGrid />
        <StatsSection />
        <GetStartedSteps />
        <TestimonialsSection />
        <PartnerSection />
        <DeliveryPersonSection />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
