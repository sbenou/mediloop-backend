import { useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Pill, FileText, Users } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useTranslation } from "react-i18next";

export const FeaturesGrid = () => {
  const navigate = useNavigate();
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });
  const { t } = useTranslation();
  
  const features = [
    {
      icon: <Search className="h-12 w-12 text-[#9b87f5]" />,
      title: t('home.features.findMedications.title'),
      description: t('home.features.findMedications.description'),
      action: () => navigate("/products"),
    },
    {
      icon: <ShoppingBag className="h-12 w-12 text-[#9b87f5]" />,
      title: t('home.features.easyOrdering.title'),
      description: t('home.features.easyOrdering.description'),
      action: () => navigate("/products"),
    },
    {
      icon: <FileText className="h-12 w-12 text-[#9b87f5]" />,
      title: "Digital Prescriptions",
      description: "Manage your prescriptions digitally and access them anytime, anywhere",
      action: () => navigate("/my-prescriptions"),
    },
    {
      icon: <Users className="h-12 w-12 text-[#9b87f5]" />,
      title: "Connect with Healthcare Providers",
      description: "Connect with doctors and manage your prescriptions seamlessly",
      action: () => navigate("/find-doctor"),
    },
    {
      icon: <Pill className="h-12 w-12 text-[#9b87f5]" />,
      title: t('home.features.managePrescriptions.title'),
      description: t('home.features.managePrescriptions.description'),
      action: () => navigate("/my-prescriptions"),
    }
  ];

  return (
    <section 
      ref={ref}
      className={`py-16 md:py-24 px-4 transform transition-all duration-700 ${
        inView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
    >
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {t('home.features.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-card rounded-lg p-6 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-105"
              onClick={feature.action}
            >
              <div className="mb-4 transform transition-transform group-hover:scale-110">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};