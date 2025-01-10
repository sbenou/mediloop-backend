import { useInView } from "react-intersection-observer";
import { useTranslation } from "react-i18next";

interface PlatformStats {
  ordersCount: number;
  pharmaciesCount: number;
  doctorsCount: number;
  prescriptionsCount: number;
}

export const StatsSection = ({ stats }: { stats: PlatformStats }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });
  const { t } = useTranslation();

  const platformStats = [
    {
      label: t('home.stats.orders'),
      value: stats.ordersCount
    },
    {
      label: t('home.stats.pharmacies'),
      value: stats.pharmaciesCount
    },
    {
      label: t('home.stats.providers'),
      value: stats.doctorsCount
    },
    {
      label: t('home.stats.prescriptions'),
      value: stats.prescriptionsCount
    }
  ];

  return (
    <section 
      ref={ref}
      className={`py-16 bg-muted/50 transform transition-all duration-700 ${
        inView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platformStats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl font-semibold text-primary mb-2">
                {stat.label}
              </div>
              <div className="text-4xl font-bold">
                {stat.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};