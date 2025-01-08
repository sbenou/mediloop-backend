import { Bike, Bell, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";

export const DeliveryPersonSection = () => {
  const navigate = useNavigate();
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const features = [
    {
      icon: Bike,
      title: "Simple Requirements",
      description: "All you need is a bicycle or electric scooter and safety equipment",
      image: "/transport.svg",
      attribution: "Transport illustrations by Storyset"
    },
    {
      icon: Bell,
      title: "Location-Based Notifications",
      description: "Get notified about nearby deliveries in your area",
      image: "/location-tracking.svg",
      attribution: "Online illustrations by Storyset"
    },
    {
      icon: DollarSign,
      title: "Monthly Payments",
      description: "Receive monthly payments for all completed deliveries",
      image: "/online-payments.svg",
      attribution: "Business illustrations by Storyset"
    }
  ];

  return (
    <section 
      ref={ref}
      className="py-16"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">
            Become a Delivery Partner
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join our network of delivery partners and earn money on your own schedule
          </p>
          <Button 
            onClick={() => navigate("/become-partner")}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            Find Out More
          </Button>
        </div>

        <div className="space-y-24 mt-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`flex items-center gap-12 ${
                index === 0 ? 'justify-start ml-0' : 
                index === 1 ? 'justify-center' : 
                'justify-end mr-0'
              } ${
                inView ? 'animate-fade-in opacity-100' : 'opacity-0'
              }`}
              style={{
                animationDelay: `${index * 200}ms`
              }}
            >
              <div className="flex-1 max-w-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600">
                  {feature.description}
                </p>
                <small className="text-gray-500 mt-2 block">
                  {feature.attribution}
                </small>
              </div>
              <div className="flex-1 max-w-md">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};