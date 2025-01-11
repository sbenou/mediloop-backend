import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Pill, Stethoscope, Truck, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

export const HeroSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const handleProfessionalSignup = (role: 'pharmacist' | 'doctor' | 'delivery') => {
    navigate('/signup', { state: { selectedRole: role } });
  };

  return (
    <section className="relative bg-gradient-to-b from-primary/10 to-background px-4 py-16 md:py-24 animate-fade-in">
      <div className="container mx-auto">
        <div className="flex flex-col items-center">
          <div className="text-center max-w-3xl mb-12">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
              {t('home.hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              {t('home.hero.subtitle')}
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                onClick={() => handleProfessionalSignup('pharmacist')}
                className="bg-[#9b87f5] hover:bg-[#8B5CF6]"
              >
                <Pill className="mr-2 h-4 w-4" />
                {t('home.hero.pharmacistsButton')}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => handleProfessionalSignup('doctor')}
              >
                <Stethoscope className="mr-2 h-4 w-4" />
                {t('home.hero.doctorsButton')}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => handleProfessionalSignup('delivery')}
                className="bg-[#F2FCE2] hover:bg-[#E2ECd2] text-[#2C3E50]"
              >
                <Truck className="mr-2 h-4 w-4" />
                {t('home.hero.deliveryButton')}
              </Button>
            </div>
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/my-prescriptions')}
                className="group"
              >
                <FileText className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Manage Your Prescriptions
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};