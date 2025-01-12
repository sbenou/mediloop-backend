import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesGrid } from "@/components/home/FeaturesGrid";
import GetStartedSteps from "@/components/home/GetStartedSteps";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <GetStartedSteps />
        <FeaturesGrid />
      </main>
      <Footer />
    </div>
  );
};

export default Index;