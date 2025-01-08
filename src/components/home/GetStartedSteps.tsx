import { Check, Store, UserPlus, ShoppingBag } from "lucide-react";

const steps = [
  {
    title: "Find a pharmacy",
    description: "Search and set your default pharmacy for convenient ordering",
    icon: Store,
    link: "/settings"
  },
  {
    title: "Connect with your doctor",
    description: "Find and connect with healthcare providers",
    icon: UserPlus,
    link: "/find-doctor"
  },
  {
    title: "Start your orders",
    description: "Browse and order medications easily",
    icon: ShoppingBag,
    link: "/products"
  }
];

const GetStartedSteps = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Get Started in 3 Easy Steps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <div className="mb-4 mt-4">
                <step.icon className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground mb-4">{step.description}</p>
              <a 
                href={step.link}
                className="text-primary hover:text-primary/80 font-medium flex items-center gap-2"
              >
                Get Started
                <Check className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GetStartedSteps;