
import { Building, Users, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";

export const PartnerSection = () => {
  const navigate = useNavigate();
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const features = [
    {
      icon: Building,
      title: "Expand Your Reach",
      description: "Connect with more patients and grow your pharmacy business"
    },
    {
      icon: Users,
      title: "Dedicated Support",
      description: "Get personalized support to help you succeed on our platform"
    },
    {
      icon: CreditCard,
      title: "Competitive Pricing",
      description: "Flexible pricing plans that grow with your business"
    }
  ];

  return (
    <section 
      ref={ref}
      className="py-16 w-full bg-gray-50"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">
            Become a Partner Pharmacy
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join our network of trusted pharmacies and expand your reach
          </p>
          <Button 
            onClick={() => navigate("/become-partner")}
            size="lg"
            className="bg-[#7E69AB] hover:bg-[#7E69AB]/90"
          >
            Join Our Network
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`text-center p-6 rounded-lg bg-white shadow-sm transition-all duration-300 ${
                inView ? 'animate-fade-in opacity-100' : 'opacity-0'
              }`}
              style={{
                animationDelay: `${index * 200}ms`
              }}
            >
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-6 w-6 text-[#9b87f5]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
