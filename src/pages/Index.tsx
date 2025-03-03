
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
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  console.log('Index page - Rendering');
  const { isAuthenticated, profile } = useAuth();
  const navigate = useNavigate();
  
  // Redirect authenticated users based on role
  useEffect(() => {
    if (isAuthenticated) {
      if (profile?.role === 'patient') {
        navigate('/patient-dashboard');
      } else if (profile?.role === 'pharmacist') {
        navigate('/pharmacy/dashboard');
      } else if (profile?.role === 'superadmin') {
        navigate('/superadmin/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, profile, navigate]);

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
  return (
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
};

export default Index;
