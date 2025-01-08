import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Search, ShoppingBag, Pill, UserPlus, Stethoscope, Users, Building2, Clipboard, ShoppingCart } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
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

  const features = [
    {
      icon: <Search className="h-12 w-12 text-primary" />,
      title: "Find Medications",
      description: "Search and compare medications from local pharmacies",
      action: () => navigate("/products"),
    },
    {
      icon: <ShoppingBag className="h-12 w-12 text-primary" />,
      title: "Easy Ordering",
      description: "Order medications for delivery or pickup",
      action: () => navigate("/products"),
    },
    {
      icon: <Pill className="h-12 w-12 text-primary" />,
      title: "Manage Prescriptions",
      description: "Upload and manage your prescriptions digitally",
      action: () => navigate("/my-prescriptions"),
    },
    {
      icon: <Stethoscope className="h-12 w-12 text-primary" />,
      title: "Connect with Doctors",
      description: "Find and connect with healthcare providers",
      action: () => navigate("/find-doctor"),
    },
  ];

  const platformStats = [
    {
      label: "Total Orders",
      value: stats?.ordersCount ?? 0
    },
    {
      label: "Partner Pharmacies",
      value: stats?.pharmaciesCount ?? 0
    },
    {
      label: "Healthcare Providers",
      value: stats?.doctorsCount ?? 0
    },
    {
      label: "Prescriptions Managed",
      value: stats?.prescriptionsCount ?? 0
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header session={session} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-primary/10 to-background px-4 py-16 md:py-24">
          <div className="container mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
                Your Health, Simplified
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Find and order medications, manage prescriptions, and connect with healthcare providers - all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate("/products")}>
                  Browse Medications
                </Button>
                {!session && (
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => navigate("/signup")}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 md:py-24 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Everything You Need
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative bg-card rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={feature.action}
                >
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {platformStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-semibold text-primary mb-2">
                    {stat.label}
                  </div>
                  <div className="text-4xl font-bold">
                    {stat.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Luxmed. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Button variant="link" size="sm">Privacy Policy</Button>
              <Button variant="link" size="sm">Terms of Service</Button>
              <Button variant="link" size="sm">Contact</Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
