import { Building2, Users, TrendingUp, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "react-intersection-observer";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

const BecomeTransporter = () => {
  const { ref: sectionRef, inView: sectionInView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const handleApply = async () => {
    try {
      setIsProcessing(true);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please create an account to become a delivery partner.",
        });
        navigate('/signup');
        return;
      }

      // Check if user is already a transporter
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role === 'transporter') {
        toast({
          variant: "destructive",
          title: "Already Registered",
          description: "You are already registered as a delivery partner.",
        });
        return;
      }

      // Update user role to transporter
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'transporter' })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      toast({
        title: "Application Successful",
        description: "Your application has been received. We'll review it and get back to you soon.",
      });
      
      navigate('/settings');
    } catch (error) {
      console.error('Error applying as transporter:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit your application. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const benefits = [
    {
      icon: Building2,
      title: "Flexible Hours",
      description: "Choose your own hours and work when it suits you best."
    },
    {
      icon: Users,
      title: "Support Network",
      description: "Join a community of delivery partners and share tips and experiences."
    },
    {
      icon: TrendingUp,
      title: "Competitive Pay",
      description: "Earn money for each successful delivery, paid monthly."
    },
    {
      icon: BadgeCheck,
      title: "Safety First",
      description: "We prioritize your safety with our comprehensive training and support."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-6">
            Become a Delivery Partner
          </h1>
          <p className="text-xl text-gray-600 text-center mb-6">
            Join our network of trusted delivery partners and earn money delivering medications to patients
          </p>
          <div className="bg-white p-6 rounded-lg shadow-sm mb-12">
            <h2 className="text-2xl font-semibold mb-4">Program Overview</h2>
            <p className="text-gray-600 mb-4">
              Our Delivery Partner Program connects you with patients who need their medications delivered. 
              You'll have the flexibility to choose your delivery hours and areas.
            </p>
            <div className="border-t border-b py-4 my-4">
              <h3 className="text-xl font-semibold mb-2">How It Works</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Accept delivery requests through our platform</li>
                <li>Deliver medications safely and on time</li>
                <li>Track your completed deliveries</li>
                <li>Get paid monthly for all completed deliveries</li>
                <li>Access to training and support resources</li>
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
              onClick={handleApply}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Apply Now"}
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              *Background check required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeTransporter;