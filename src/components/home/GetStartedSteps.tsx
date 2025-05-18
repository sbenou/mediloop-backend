
import { Store, UserRound, Pill } from "lucide-react";
import { Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { useTranslation } from "react-i18next";

const GetStartedSteps = () => {
  const { t } = useTranslation();
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const steps = [
    {
      icon: Store,
      title: t('home.getStarted.steps.findPharmacy.title'),
      description: t('home.getStarted.steps.findPharmacy.description'),
      link: "/search-pharmacy", // Updated link to point to SearchPharmacy page
      dataTestId: "find-pharmacy-link"
    },
    {
      icon: UserRound,
      title: t('home.getStarted.steps.connectDoctor.title'),
      description: t('home.getStarted.steps.connectDoctor.description'),
      link: "/find-doctor",
      dataTestId: "find-doctor-link"
    },
    {
      icon: Pill,
      title: t('home.getStarted.steps.orderMedications.title'),
      description: t('home.getStarted.steps.orderMedications.description'),
      link: "/products",
      dataTestId: "order-medications-link"
    }
  ];

  return (
    <div 
      ref={ref}
      className={`py-24 sm:py-32 transform transition-all duration-700 ${
        inView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('home.getStarted.title')}
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {t('home.getStarted.subtitle')}
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-0 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="flex flex-col items-center">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#7E69AB]">
                  <span className="text-lg font-bold text-white">{index + 1}</span>
                </div>
                <div className="w-full max-w-[350px] transition-all hover:scale-105">
                  <div className="bg-card p-4 flex flex-col items-center h-full">
                    <step.icon className="h-10 w-10 text-[#7E69AB] mb-4" aria-hidden="true" />
                    <dt className="text-xl font-semibold leading-7 mb-4 whitespace-nowrap">
                      {step.title}
                    </dt>
                    <dd className="flex-1 text-base leading-7 text-muted-foreground text-center mb-4 max-w-[260px]">
                      <p>{step.description}</p>
                    </dd>
                    <Link
                      to={step.link}
                      className="text-[#7E69AB] hover:text-[#7E69AB]/80 font-semibold"
                      data-testid={step.dataTestId || ""}
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
