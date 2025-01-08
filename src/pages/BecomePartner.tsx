import { Bike, Shield, MapPin, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "react-intersection-observer";

const BecomePartner = () => {
  const { ref: sectionRef, inView: sectionInView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const steps = [
    {
      icon: Bike,
      title: "Equipment Requirements",
      description: "You'll need a bicycle or electric scooter along with mandatory safety equipment including helmet, reflective vest, and lights."
    },
    {
      icon: Shield,
      title: "Safety First",
      description: "We prioritize your safety. All partners must complete a basic road safety course and maintain their equipment in good condition."
    },
    {
      icon: MapPin,
      title: "Location-Based Work",
      description: "Work in your preferred areas. Our app notifies you of nearby delivery opportunities, allowing you to choose your deliveries."
    },
    {
      icon: Wallet,
      title: "Monthly Earnings",
      description: "Earn competitive rates for each delivery. Payments are processed monthly, with detailed earnings reports provided."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-6">
            Join Our Delivery Network
          </h1>
          <p className="text-xl text-gray-600 text-center mb-12">
            Make money on your own schedule while helping your community access essential medications
          </p>

          <div 
            ref={sectionRef}
            className={`grid grid-cols-1 md:grid-cols-2 gap-8 transform transition-all duration-700 ${
              sectionInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`bg-white p-8 rounded-lg shadow-sm transform transition-all duration-700 delay-${index * 200} ${
                  sectionInView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
              >
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Apply Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomePartner;