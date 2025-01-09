import { useInView } from "react-intersection-observer";
import { Building2, Users, TrendingUp, BadgeCheck } from "lucide-react";
import BenefitCard from "./BenefitCard";

const benefits = [
  {
    icon: Building2,
    title: "Flexible Hours",
    description: "Choose your own hours and work when it suits you best."
  },
  {
    icon: Users,
    title: "Support Network",
    description: "Join a community of delivery partners and share tips and experiences."
  },
  {
    icon: TrendingUp,
    title: "Competitive Pay",
    description: "Earn money for each successful delivery, paid monthly."
  },
  {
    icon: BadgeCheck,
    title: "Safety First",
    description: "We prioritize your safety with our comprehensive training and support."
  }
];

const BenefitsSection = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <div 
      ref={ref}
      className={`grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 transform transition-all duration-700 ${
        inView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
    >
      {benefits.map((benefit, index) => (
        <div 
          key={index}
          className={`transform transition-all duration-700 delay-${index * 200} ${
            inView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          <BenefitCard {...benefit} />
        </div>
      ))}
    </div>
  );
};

export default BenefitsSection;