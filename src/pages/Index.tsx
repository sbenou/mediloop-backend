
import React from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesGrid } from "@/components/home/FeaturesGrid";
import { StatsSection } from "@/components/home/StatsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import GetStartedSteps from "@/components/home/GetStartedSteps";
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
    </div>
  );
}
