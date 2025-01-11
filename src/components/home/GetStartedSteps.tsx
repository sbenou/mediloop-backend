import { useNavigate } from "react-router-dom";
import { Search, ShoppingBag, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

const GetStartedSteps = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const steps = [
    {
      icon: <Search className="h-12 w-12 text-[#9b87f5]" />,
      title: t('home.getStarted.search.title'),
      description: t('home.getStarted.search.description'),
      action: () => navigate("/products")
    },
    {
      icon: <ShoppingBag className="h-12 w-12 text-[#7E69AB]" />,
      title: t('home.getStarted.order.title'),
      description: t('home.getStarted.order.description'),
      action: () => navigate("/products")
    },
    {
      icon: <FileText className="h-12 w-12 text-[#6E59A5]" />,
      title: t('home.getStarted.prescriptions.title'),
      description: t('home.getStarted.prescriptions.description'),
      action: () => navigate("/my-prescriptions")
    }
  ];

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {t('home.getStarted.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group relative bg-card rounded-lg p-6 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={step.action}
            >
              <div className="mb-4 transform transition-transform group-hover:scale-110">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GetStartedSteps;