interface PlatformStats {
  ordersCount: number;
  pharmaciesCount: number;
  doctorsCount: number;
  prescriptionsCount: number;
}

export const StatsSection = ({ stats }: { stats: PlatformStats }) => {
  const platformStats = [
    {
      label: "Total Orders",
      value: stats.ordersCount
    },
    {
      label: "Partner Pharmacies",
      value: stats.pharmaciesCount
    },
    {
      label: "Healthcare Providers",
      value: stats.doctorsCount
    },
    {
      label: "Prescriptions Managed",
      value: stats.prescriptionsCount
    }
  ];

  return (
    <section className="py-16 bg-muted/50">
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