
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesGrid } from "@/components/home/FeaturesGrid";
import { DeliveryPersonSection } from "@/components/home/DeliveryPersonSection";
import { PartnerSection } from "@/components/home/PartnerSection";
import { StatsSection } from "@/components/home/StatsSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import GetStartedSteps from "@/components/home/GetStartedSteps";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import CountrySelector from "@/components/CountrySelector";
import { useAuth } from "@/hooks/auth/useAuth";
import PatientLayout from "@/components/layout/PatientLayout";

const Index = () => {
  console.log('Index page - Rendering');
  const { isAuthenticated, userRole } = useAuth();
  
  // Fetch statistics including new connection count
  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      try {
        const [
          { count: ordersCount } = { count: 0 },
          { count: pharmaciesCount } = { count: 0 },
          { count: doctorsCount } = { count: 0 },
          { count: prescriptionsCount } = { count: 0 },
          { count: connectionsCount } = { count: 0 },
        ] = await Promise.all([
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'pharmacist'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'doctor'),
          supabase.from('prescriptions').select('*', { count: 'exact', head: true }),
          supabase.from('doctor_patient_connections').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
        ]);

        return {
          ordersCount: ordersCount || 0,
          pharmaciesCount: pharmaciesCount || 0,
          doctorsCount: doctorsCount || 0,
          prescriptionsCount: prescriptionsCount || 0,
          connectionsCount: connectionsCount || 0,
        };
      } catch (error) {
        console.error('Error fetching stats:', error);
        return {
          ordersCount: 0,
          pharmaciesCount: 0,
          doctorsCount: 0,
          prescriptionsCount: 0,
          connectionsCount: 0,
        };
      }
    },
  });

  // Regular home page content
  const homePageContent = (
    <div className="min-h-screen flex flex-col">
      <Header />
      <CountrySelector />
      
      <main className="flex-1">
        <HeroSection />
        <GetStartedSteps />
        <FeaturesGrid />
        <PartnerSection />
        <DeliveryPersonSection />
        <StatsSection stats={stats || { ordersCount: 0, pharmaciesCount: 0, doctorsCount: 0, prescriptionsCount: 0, connectionsCount: 0 }} />
        <TestimonialsSection />
      </main>

      <Footer />
    </div>
  );

  // If the user is authenticated, check role and show appropriate layout
  if (isAuthenticated) {
    // For patient role, show patient layout with home page content
    if (userRole === 'patient') {
      return (
        <PatientLayout>
          <div className="space-y-8">
            <h1 className="text-3xl font-bold">Welcome to Your Patient Dashboard</h1>
            <GetStartedSteps />
            <StatsSection stats={stats || { ordersCount: 0, pharmaciesCount: 0, doctorsCount: 0, prescriptionsCount: 0, connectionsCount: 0 }} />
          </div>
        </PatientLayout>
      );
    }
    
    // For now, other roles see the regular home page
    return homePageContent;
  }

  // Not authenticated - show regular home page
  return homePageContent;
};

export default Index;
