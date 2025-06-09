
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { UserPlus, ShoppingBag } from "lucide-react";

export const HeroSection = () => {
  const navigate = useNavigate();
  
  return (
    <section className="relative min-h-[600px] flex items-center py-16 md:py-24 w-full overflow-hidden">
      {/* Background image with overlay - full width on all screens */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: "url('/hero-background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Gradient overlay */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: 'linear-gradient(to right, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.4) 100%)',
        }}
      />
      
      {/* Content overlay */}
      <div className="container mx-auto relative z-10 px-4">
        <div className="flex flex-col items-center">
          <div className="text-center max-w-3xl mb-12">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
              Your Health, Delivered
            </h1>
            <p className="text-lg md:text-xl text-[#1A1F2C] font-medium mb-8">
              Connect with healthcare providers and get your medications delivered to your door
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate('/signup')}
                className="bg-[#7E69AB] hover:bg-[#6E59A5]"
              >
                <UserPlus className="mr-2 h-4 w-4 text-white" />
                Sign up for free
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/products')}
              >
                <ShoppingBag className="mr-2 h-4 w-4 text-[#7E69AB]" />
                Browse Products
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
