import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Pill, Stethoscope, Truck } from "lucide-react";

export const HeroSection = () => {
  const navigate = useNavigate();
  
  const handleProfessionalSignup = (role: 'pharmacist' | 'doctor' | 'delivery') => {
    navigate('/signup', { state: { selectedRole: role } });
  };

  return (
    <section className="relative bg-gradient-to-b from-primary/10 to-background px-4 py-16 md:py-24">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
              Your Health, Simplified
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Find and order medications, manage prescriptions, and connect with healthcare providers - all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button 
                size="lg" 
                onClick={() => handleProfessionalSignup('pharmacist')}
                className="bg-[#9b87f5] hover:bg-[#8B5CF6]"
              >
                <Pill className="mr-2 h-4 w-4" />
                Pharmacists
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => handleProfessionalSignup('doctor')}
              >
                <Stethoscope className="mr-2 h-4 w-4" />
                Doctors
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => handleProfessionalSignup('delivery')}
                className="bg-[#F2FCE2] hover:bg-[#E2ECd2] text-[#2C3E50]"
              >
                <Truck className="mr-2 h-4 w-4" />
                Delivery man
              </Button>
            </div>
          </div>
          <div className="hidden md:block relative">
            <img
              src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81"
              alt="Medical Team"
              className="rounded-lg shadow-xl w-full object-cover h-[500px] animate-fade-in"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded-lg"></div>
          </div>
        </div>
      </div>
    </section>
  );
};