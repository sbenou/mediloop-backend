import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesGrid } from "@/components/home/FeaturesGrid";
import { DeliveryPersonSection } from "@/components/home/DeliveryPersonSection";
import { StatsSection } from "@/components/home/StatsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import GetStartedSteps from "@/components/home/GetStartedSteps";

const Index = () => {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      try {
        const [
          { count: ordersCount } = { count: 0 },
          { count: pharmaciesCount } = { count: 0 },
          { count: doctorsCount } = { count: 0 },
        ] = await Promise.all([
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'pharmacist'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'doctor'),
        ]);

        return {
          ordersCount: ordersCount || 0,
          pharmaciesCount: pharmaciesCount || 0,
          doctorsCount: doctorsCount || 0,
          prescriptionsCount: 0, // Default to 0 until prescriptions table is created
        };
      } catch (error) {
        console.error('Error fetching stats:', error);
        return {
          ordersCount: 0,
          pharmaciesCount: 0,
          doctorsCount: 0,
          prescriptionsCount: 0,
        };
      }
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header session={session} />
      
      <main className="flex-1">
        <HeroSection />
        <GetStartedSteps />
        <FeaturesGrid />
        <DeliveryPersonSection />
        <StatsSection stats={stats || { ordersCount: 0, pharmaciesCount: 0, doctorsCount: 0, prescriptionsCount: 0 }} />
        <TestimonialsSection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;