
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesGrid } from "@/components/home/FeaturesGrid";
import { StatsSection } from "@/components/home/StatsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import GetStartedSteps from "@/components/home/GetStartedSteps";
import { DeliveryPersonSection } from "@/components/home/DeliveryPersonSection";
import { PartnerSection } from "@/components/home/PartnerSection";
import { Button } from "@/components/ui/button";

const Index = () => {
  console.info("Index page - Rendering");
  
  // Mock data for StatsSection - will be replaced by actual API data
  const mockStats = {
    ordersCount: 125000,
    pharmaciesCount: 450,
    doctorsCount: 1200,
    prescriptionsCount: 250000,
    connectionsCount: 35000
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesGrid />
        <StatsSection stats={mockStats} />
        <TestimonialsSection />
        <GetStartedSteps />
        <DeliveryPersonSection />
        <PartnerSection />
        
        {/* Temporary navigation section for testing pharmacy routes */}
        <div className="container mx-auto py-8 border-t mt-12">
          <h2 className="text-2xl font-bold mb-4">Testing Navigation</h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/pharmacy/patients">
              <Button variant="outline">Pharmacy Patients</Button>
            </Link>
            <Link to="/pharmacy/orders">
              <Button variant="outline">Pharmacy Orders</Button>
            </Link>
            <Link to="/pharmacy/prescriptions">
              <Button variant="outline">Pharmacy Prescriptions</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
