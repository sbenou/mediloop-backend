import { Building2, Users, TrendingUp, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "react-intersection-observer";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

const BecomePartner = () => {
  const { ref: sectionRef, inView: sectionInView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    try {
      setIsProcessing(true);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please create an account to become a partner.",
        });
        navigate('/signup');
        return;
      }

      // Check if user is a pharmacist
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'pharmacist') {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "Only pharmacists can subscribe to the Partner Program.",
        });
        return;
      }

      // Create checkout session
      const { data, error } = await supabase.functions.invoke('create-pharmacy-subscription', {
        body: { priceId: 'price_1QfDc2A1DaoRGs36hsqAfkEG' }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start subscription process. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const benefits = [
    {
      icon: Building2,
      title: "Digital Presence",
      description: "Get a dedicated digital storefront to showcase your pharmacy and products to our growing user base."
    },
    {
      icon: Users,
      title: "Customer Retention",
      description: "Our platform helps you build lasting relationships with customers through convenient medication delivery and refill reminders."
    },
    {
      icon: TrendingUp,
      title: "Business Growth",
      description: "Access detailed analytics and insights to optimize your inventory and increase sales through our platform."
    },
    {
      icon: BadgeCheck,
      title: "Quality Assurance",
      description: "Join our network of verified pharmacies and build trust with customers through our quality guarantee program."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-6">
            Pharmacy Partner Program
          </h1>
          <p className="text-xl text-gray-600 text-center mb-6">
            Join our network of trusted pharmacies and grow your business with our digital platform
          </p>
          <div className="bg-white p-6 rounded-lg shadow-sm mb-12">
            <h2 className="text-2xl font-semibold mb-4">Program Overview</h2>
            <p className="text-gray-600 mb-4">
              Our Partner Program is designed to help pharmacies thrive in the digital age. With a 12-month commitment, 
              you'll get access to our full suite of tools and features to enhance your business operations and customer reach.
            </p>
            <div className="border-t border-b py-4 my-4">
              <h3 className="text-xl font-semibold mb-2">Subscription Details</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Monthly subscription fee: $199/month</li>
                <li>12-month minimum commitment</li>
                <li>Full access to our digital platform and delivery network</li>
                <li>Priority customer support</li>
                <li>Regular business insights and analytics</li>
              </ul>
            </div>
          </div>

          <div 
            ref={sectionRef}
            className={`grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 transform transition-all duration-700 ${
              sectionInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className={`bg-white p-8 rounded-lg shadow-sm transform transition-all duration-700 delay-${index * 200} ${
                  sectionInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
              >
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSubscribe}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Subscribe Now - $199/month"}
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              *12-month minimum commitment required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomePartner;