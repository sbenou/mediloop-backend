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
      image: "/lovable-uploads/e1121849-4e5c-496c-b196-929ffe5eff11.png",
      attribution: "Transport illustrations"
    },
    {
      icon: Bell,
      title: "Location-Based Notifications",
      description: "Get notified about nearby deliveries in your area",
      image: "/lovable-uploads/5a25d363-d8b5-44bd-a39d-d9bfcc4d50c5.png",
      attribution: "Online illustrations"
    },
    {
      icon: DollarSign,
      title: "Monthly Payments",
      description: "Receive monthly payments for all completed deliveries",
      image: "/lovable-uploads/8e0651b0-5b95-4f7d-bdf8-9d8995d6c915.png",
      attribution: "Business illustrations"
    }
  ];

  return (
    <section 
      ref={ref}
      className="py-16 px-4"
    >
      <div className="container mx-auto">
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

        <div className="max-w-4xl mx-auto space-y-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`flex items-center gap-8 ${
                inView ? 'animate-fade-in opacity-100' : 'opacity-0'
              }`}
              style={{
                animationDelay: `${index * 200}ms`
              }}
            >
              {index === 1 ? (
                <>
                  <div className="flex-1">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-auto max-w-[200px] mx-auto"
                      loading="lazy"
                      onError={(e) => {
                        console.error(`Error loading image: ${feature.image}`);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <feature.icon className="h-7 w-7 text-primary" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600">
                          {feature.description}
                        </p>
                        <small className="text-xs text-gray-500 mt-1 block">
                          {feature.attribution}
                        </small>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="flex items-start">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <feature.icon className="h-7 w-7 text-primary" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600">
                          {feature.description}
                        </p>
                        <small className="text-xs text-gray-500 mt-1 block">
                          {feature.attribution}
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-auto max-w-[200px] mx-auto"
                      loading="lazy"
                      onError={(e) => {
                        console.error(`Error loading image: ${feature.image}`);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};