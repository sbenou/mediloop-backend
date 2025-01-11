import Header from "@/components/layout/Header";
import HeroSection from "@/components/home/HeroSection";
import StatsSection from "@/components/home/StatsSection";
import FeaturesGrid from "@/components/home/FeaturesGrid";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import GetStartedSteps from "@/components/home/GetStartedSteps";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header session={session} />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesGrid />
        <GetStartedSteps />
        <TestimonialsSection />
      </main>
    </div>
  );
};

export default Index;