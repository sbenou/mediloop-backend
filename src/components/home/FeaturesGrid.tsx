import { useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Pill, Stethoscope } from "lucide-react";

export const FeaturesGrid = () => {
  const navigate = useNavigate();
  
  const features = [
    {
      icon: <Search className="h-12 w-12 text-primary" />,
      title: "Find Medications",
      description: "Search and compare medications from local pharmacies",
      action: () => navigate("/products"),
    },
    {
      icon: <ShoppingBag className="h-12 w-12 text-primary" />,
      title: "Easy Ordering",
      description: "Order medications for delivery or pickup",
      action: () => navigate("/products"),
    },
    {
      icon: <Pill className="h-12 w-12 text-primary" />,
      title: "Manage Prescriptions",
      description: "Upload and manage your prescriptions digitally",
      action: () => navigate("/my-prescriptions"),
    },
    {
      icon: <Stethoscope className="h-12 w-12 text-primary" />,
      title: "Connect with Doctors",
      description: "Find and connect with healthcare providers",
      action: () => navigate("/find-doctor"),
    },
  ];

  return (
    <section className="py-16 md:py-24 px-4 animate-slide-up [animation-delay:600ms] opacity-0 [animation-fill-mode:forwards]">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Everything You Need
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-card rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={feature.action}
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};