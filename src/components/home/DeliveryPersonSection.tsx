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
      description: "All you need is a bicycle or electric scooter and safety equipment"
    },
    {
      icon: Bell,
      title: "Location-Based Notifications",
      description: "Get notified about nearby deliveries in your area"
    },
    {
      icon: DollarSign,
      title: "Monthly Payments",
      description: "Receive monthly payments for all completed deliveries"
    }
  ];

  return (
    <section 
      ref={ref}
      className={`py-16 bg-gradient-to-r from-purple-100 to-purple-50 transform transition-all duration-700 ${
        inView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {features.map((feature, index) => (
            <div 
              key={index}
              className={`bg-white p-6 rounded-lg shadow-sm transform transition-all duration-700 delay-${index * 200} ${
                inView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
            >
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-center">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-center">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};