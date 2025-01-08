import { Store, UserRound, Pill } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    title: "Find a pharmacy",
    description: "Search and set your default pharmacy for convenient ordering",
    icon: Store,
    link: "/search-pharmacy"
  },
  {
    title: "Connect with your doctor",
    description: "Link your account with your healthcare provider",
    icon: UserRound,
    link: "/find-doctor"
  },
  {
    title: "Order medications",
    description: "Browse and order medications with or without prescription",
    icon: Pill,
    link: "/products"
  }
];

const GetStartedSteps = () => {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Get Started in 3 Easy Steps
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Follow these simple steps to start ordering your medications online
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-2 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="flex flex-col items-center">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                  <span className="text-xl font-bold text-white">{index + 1}</span>
                </div>
                <div className="w-full max-w-[260px] transition-all hover:scale-105">
                  <div className="bg-card p-6 flex flex-col items-center h-full">
                    <step.icon className="h-8 w-8 text-primary mb-4" aria-hidden="true" />
                    <dt className="text-xl font-semibold leading-7 mb-4 whitespace-nowrap">
                      {step.title}
                    </dt>
                    <dd className="flex-1 text-base leading-7 text-muted-foreground text-center mb-4 max-w-[200px]">
                      <p>{step.description}</p>
                    </dd>
                    <Link
                      to={step.link}
                      className="text-primary hover:text-primary/80 font-semibold"
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default GetStartedSteps;