
import { useInView } from "react-intersection-observer";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { LocalCache } from "@/lib/cache";

interface PlatformStats {
  ordersCount: number;
  pharmaciesCount: number;
  doctorsCount: number;
  prescriptionsCount: number;
  connectionsCount: number;
}

const STATS_CACHE_KEY = 'platform_stats';
const STATS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export const StatsSection = ({ stats }: { stats?: PlatformStats }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });
  const { t } = useTranslation();
  const [loading, setLoading] = useState(!stats);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(stats || null);

  useEffect(() => {
    const fetchStats = async () => {
      if (stats) {
        setPlatformStats(stats);
        setLoading(false);
        return;
      }

      // Check if cache is valid and not expired
      const cachedStats = LocalCache.get<PlatformStats>(STATS_CACHE_KEY);
      const cacheTimestamp = LocalCache.get<number>(`${STATS_CACHE_KEY}_timestamp`);
      const isCacheValid = cachedStats && cacheTimestamp && (Date.now() - cacheTimestamp < STATS_CACHE_DURATION);
      
      if (isCacheValid) {
        console.log('Using cached platform stats');
        setPlatformStats(cachedStats);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching platform stats from database...');
        
        // Fetch real statistics from various tables
        const [
          { count: ordersCount, error: ordersError }, 
          { count: pharmaciesCount, error: pharmaciesError }, 
          { count: doctorsCount, error: doctorsError }, 
          { count: prescriptionsCount, error: prescriptionsError },
          { count: connectionsCount, error: connectionsError }
        ] = await Promise.all([
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          // Only count endorsed pharmacies (those who have paid for a subscription)
          supabase.from('pharmacies').select('*', { count: 'exact', head: true }).eq('endorsed', true),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'doctor'),
          supabase.from('prescriptions').select('*', { count: 'exact', head: true }),
          supabase.from('doctor_patient_connections').select('*', { count: 'exact', head: true }),
        ]);

        if (ordersError || pharmaciesError || doctorsError || prescriptionsError || connectionsError) {
          throw new Error('Error fetching stats');
        }

        const fetchedStats = {
          ordersCount: ordersCount || 0,
          pharmaciesCount: pharmaciesCount || 0,
          doctorsCount: doctorsCount || 0,
          prescriptionsCount: prescriptionsCount || 0,
          connectionsCount: connectionsCount || 0
        };
        
        console.log('Fetched stats:', fetchedStats);
        
        // Cache the results with a timestamp
        LocalCache.set(STATS_CACHE_KEY, fetchedStats);
        LocalCache.set(`${STATS_CACHE_KEY}_timestamp`, Date.now());
        setPlatformStats(fetchedStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback to mock data if database fetch fails
        const mockStats = {
          ordersCount: 250000,
          pharmaciesCount: 0, // Show 0 endorsed pharmacies as fallback
          doctorsCount: 3500,
          prescriptionsCount: 480000,
          connectionsCount: 85000
        };
        console.log('Using mock stats due to error:', mockStats);
        setPlatformStats(mockStats);
      } finally {
        setLoading(false);
      }
    };

    if (inView) {
      fetchStats();
    }
  }, [inView, stats]);

  // Create stats items array
  const statsItems = platformStats ? [
    {
      label: t('home.stats.orders').split(' ').join('\n'),
      value: platformStats.ordersCount
    },
    {
      label: t('home.stats.pharmacies').split(' ').join('\n'),
      value: platformStats.pharmaciesCount
    },
    {
      label: t('home.stats.providers').split(' ').join('\n'),
      value: platformStats.doctorsCount
    },
    {
      label: t('home.stats.prescriptions').split(' ').join('\n'),
      value: platformStats.prescriptionsCount
    },
    {
      label: "Active\nConnections",
      value: platformStats.connectionsCount
    }
  ] : [];

  return (
    <section 
      ref={ref}
      className={`py-16 bg-muted/50 transform transition-all duration-700 ${
        inView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {loading ? (
            // Skeleton loaders while data is being fetched
            Array(5).fill(0).map((_, index) => (
              <div key={index} className="text-center">
                <Skeleton className="h-8 w-32 mx-auto mb-2" />
                <Skeleton className="h-12 w-24 mx-auto" />
              </div>
            ))
          ) : (
            statsItems.map((stat, index) => (
              <div key={index} className="text-center transform hover:scale-105 transition-transform">
                <div className="text-2xl font-semibold text-primary mb-2 whitespace-pre-line h-14 flex items-center justify-center">
                  {stat.label}
                </div>
                <div className="text-4xl font-bold text-[#7E69AB]">
                  {stat.value.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
