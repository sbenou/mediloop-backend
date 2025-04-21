
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import ProgramOverview from "@/components/transporter/ProgramOverview";
import BenefitsSection from "@/components/transporter/BenefitsSection";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader } from "lucide-react";

const BecomeTransporter = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Check authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access this page.",
      });
      navigate('/login', { state: { returnUrl: '/become-transporter' } });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleApply = async () => {
    try {
      setIsProcessing(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please create an account to become a delivery partner.",
        });
        navigate('/signup');
        return;
      }

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

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render page content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

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
          
          <ProgramOverview />
          <BenefitsSection />

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
