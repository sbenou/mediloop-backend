
import { Bike, Bell, DollarSign } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { DeliveryFeature } from "./delivery/DeliveryFeature";
import { DeliveryHeader } from "./delivery/DeliveryHeader";

export const DeliveryPersonSection = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const features = [
    {
      icon: Bike,
      title: "Flexible Requirements",
      description: "Join our delivery network with minimal requirements and start earning",
      image: "/lovable-uploads/e1121849-4e5c-496c-b196-929ffe5eff11.png"
    },
    {
      icon: Bell,
      title: "Real-time Notifications",
      description: "Get instant notifications for new delivery opportunities in your area",
      image: "/lovable-uploads/5a25d363-d8b5-44bd-a39d-d9bfcc4d50c5.png"
    },
    {
      icon: DollarSign,
      title: "Competitive Payments",
      description: "Earn competitive rates with transparent pricing and monthly payments",
      image: "/lovable-uploads/8e0651b0-5b95-4f7d-bdf8-9d8995d6c915.png"
    }
  ];

  return (
    <section 
      ref={ref}
      className="py-16 px-4"
    >
      <div className="container mx-auto max-w-6xl">
        <DeliveryHeader />
        
        <div className="max-w-4xl mx-auto space-y-8">
          {features.map((feature, index) => (
            <DeliveryFeature
              key={index}
              {...feature}
              isReversed={index === 1}
              animationDelay={index * 200}
              inView={inView}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
