
import React from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesGrid } from "@/components/home/FeaturesGrid";
import { StatsSection } from "@/components/home/StatsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import GetStartedSteps from "@/components/home/GetStartedSteps";
import { PartnerSection } from "@/components/home/PartnerSection";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Index() {
  return (
    <>
      <Header />
      <HeroSection />
      <div className="container mx-auto px-4">
        <FeaturesGrid />
        <StatsSection />
        <GetStartedSteps />
        <PartnerSection />
        <TestimonialsSection />
      </div>
      <Footer />
    </>
  );
}
