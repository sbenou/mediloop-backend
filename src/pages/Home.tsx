import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesGrid } from "@/components/home/FeaturesGrid";
import { StatsSection } from "@/components/home/StatsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { GetStartedSteps } from "@/components/home/GetStartedSteps";
import { PartnerSection } from "@/components/home/PartnerSection";
import { DeliveryPersonSection } from "@/components/home/DeliveryPersonSection";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { useAuth } from "@/hooks/auth/useAuth";

const Home = () => {
  const { isAuthenticated } = useAuth();

  console.log('[Home] Rendering home page, isAuthenticated:', isAuthenticated);

  return (
    <UnifiedLayout>
      <div className="min-h-screen">
        {/* Quick auth navigation for testing */}
        <div className="bg-gray-50 border-b p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-lg font-semibold">Healthcare Platform</h1>
            {!isAuthenticated && (
              <div className="space-x-2">
                <Button asChild variant="outline">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
            {isAuthenticated && (
              <Button asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            )}
          </div>
        </div>

        <HeroSection />
        <FeaturesGrid />
        <StatsSection />
        <TestimonialsSection />
        <GetStartedSteps />
        <PartnerSection />
        <DeliveryPersonSection />
      </div>
    </UnifiedLayout>
  );
};

export default Home;
