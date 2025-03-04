
import { useEffect } from "react";
import { Link } from "react-router-dom";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesGrid } from "@/components/home/FeaturesGrid";
import { StatsSection } from "@/components/home/StatsSection";
import { GetStartedSteps } from "@/components/home/GetStartedSteps";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { PartnerSection } from "@/components/home/PartnerSection";
import { DeliveryPersonSection } from "@/components/home/DeliveryPersonSection";

// The Index page showcases the main landing page
const Index = () => {
  useEffect(() => {
    // Force window resize event to ensure charts and components render correctly
    window.dispatchEvent(new Event('resize'));
  }, []);

  return (
    <UnifiedLayoutTemplate>
      <div className="flex flex-col gap-20 pb-20">
        <HeroSection />
        <FeaturesGrid />
        <StatsSection />
        <GetStartedSteps />
        <TestimonialsSection />
        <PartnerSection />
        <DeliveryPersonSection />
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default Index;
