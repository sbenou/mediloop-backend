
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesGrid } from "@/components/home/FeaturesGrid";
import { StatsSection } from "@/components/home/StatsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import GetStartedSteps from "@/components/home/GetStartedSteps";
import { PartnerSection } from "@/components/home/PartnerSection";
import { DeliveryPersonSection } from "@/components/home/DeliveryPersonSection";
import { useAuth } from "@/hooks/auth/useAuth";

const Home = () => {
  const { isAuthenticated } = useAuth();

  console.log('[Home] Rendering home page, isAuthenticated:', isAuthenticated);

  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesGrid />
      <StatsSection />
      <TestimonialsSection />
      <GetStartedSteps />
      <PartnerSection />
      <DeliveryPersonSection />
    </div>
  );
};

export default Home;
