import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { UserPlus, ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";

export const HeroSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <section className="relative min-h-[600px] flex items-center bg-gradient-to-b from-primary/10 to-background px-4 py-16 md:py-24 animate-fade-in">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/lovable-uploads/89c7246f-95c7-47ac-b1bd-56e5838289fc.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.15
        }}
      />
      
      {/* Content overlay */}
      <div className="container mx-auto relative z-10">
        <div className="flex flex-col items-center">
          <div className="text-center max-w-3xl mb-12">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
              {t('home.hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              {t('home.hero.subtitle')}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/signup')}
                className="bg-[#9b87f5] hover:bg-[#8B5CF6]"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Sign up for free
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/products')}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Browse Products
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};