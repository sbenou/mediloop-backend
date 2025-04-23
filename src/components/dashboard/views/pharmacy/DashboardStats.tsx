
import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ShoppingBag, FileText, TrendingUp, TrendingDown, Video, CreditCard } from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Area 
} from "recharts";
import PatientsGoalCard from "./PatientsGoalCard";

interface DashboardStatsProps {
  stats: {
    total_patients?: number;
    pending_orders?: number;
    total_prescriptions?: number;
    monthly_revenue?: number;
    patient_trend?: Array<{ value: number }>;
    orders_trend?: Array<{ value: number }>;
    prescriptions_trend?: Array<{ value: number }>;
    revenue_trend?: Array<{ value: number }>;
  } | null;
  isLoading: boolean;
  onNavigate: (path: string) => void;
  userRole?: string;
}

// Generate mock data with more dramatic variations
const generateMockTrendData = (trend: number = 1) => {
  return Array(6).fill(0).map(() => ({
    value: Math.floor(
      (Math.random() < 0.5 ? -1 : 1) * 
      (5 + Math.random() * 20) * trend
    )
  }));
};

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, isLoading, onNavigate, userRole = 'pharmacist' }) => {
  const patientTrend = stats?.patient_trend || generateMockTrendData(1);
  const ordersTrend = stats?.orders_trend || generateMockTrendData(-0.5);
  const prescriptionsTrend = stats?.prescriptions_trend || generateMockTrendData(0.8);
  const revenueTrend = stats?.revenue_trend || generateMockTrendData(1.2);

  const isPatientTrendPositive = patientTrend[0].value < patientTrend[patientTrend.length - 1].value;
  const isOrdersTrendPositive = ordersTrend[0].value < ordersTrend[ordersTrend.length - 1].value;
  const isPrescriptionsTrendPositive = prescriptionsTrend[0].value < prescriptionsTrend[prescriptionsTrend.length - 1].value;
  const isRevenueTrendPositive = revenueTrend[0].value < revenueTrend[revenueTrend.length - 1].value;

  const firstCardConfig = userRole === 'patient' 
    ? { 
        label: 'Active Teleconsultations', 
        icon: <Video className="h-5 w-5 text-muted-foreground" />,
        path: 'teleconsultations'
      }
    : null;

  const fourthCardConfig = userRole === 'patient'
    ? {
        label: 'Completed Payments',
        icon: <CreditCard className="h-5 w-5 text-muted-foreground" />,
        path: 'orders'
      }
    : {
        label: 'Monthly Revenue',
        icon: <span className="text-muted-foreground">€</span>,
        path: ''
      };

  const showPatientsGoal = userRole === "doctor" || userRole === "pharmacist";
  const patientsGoal = 30000;
  const patientsCount = stats?.total_patients || 0;
  const patientsPercentChange = 4.8;

  // Updated colors for a more modern look
  const lineColors = {
    patients: "#2563eb", // blue-600
    orders: "#f97316", // orange-500
    prescriptions: "#8b5cf6", // violet-500
    revenue: "#10b981" // emerald-500
  };

  const areaColors = {
    patients: "rgba(37, 99, 235, 0.1)",
    orders: "rgba(249, 115, 22, 0.1)",
    prescriptions: "rgba(139, 92, 246, 0.1)",
    revenue: "rgba(16, 185, 129, 0.1)"
  };

  const sparklineHeight = 48;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {showPatientsGoal && (
        <PatientsGoalCard
          total={patientsCount}
          goal={patientsGoal}
          percentChange={patientsPercentChange}
          isPositive={patientsPercentChange >= 0}
        />
      )}

      {firstCardConfig && (
        <Card 
          className="relative overflow-hidden bg-white p-6 hover:shadow-md transition-shadow duration-200"
          onClick={() => onNavigate(firstCardConfig.path)}
        >
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">{firstCardConfig.label}</h3>
            {firstCardConfig.icon}
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div>
              <div className="text-2xl font-semibold mb-3">+{stats?.total_patients || 0}</div>
              <div className="h-8 mt-4">
                <div className="flex items-center text-xs">
                  {isPatientTrendPositive ? 
                    <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" /> : 
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  }
                  <span className={`${isPatientTrendPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                    YTD
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={sparklineHeight}>
                  <LineChart data={patientTrend} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                    <defs>
                      <linearGradient id="patientsShadow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={areaColors.patients} stopOpacity={1}/>
                        <stop offset="100%" stopColor={areaColors.patients} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="none"
                      fill="url(#patientsShadow)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={lineColors.patients}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card 
        className="relative overflow-hidden bg-white p-6 hover:shadow-md transition-shadow duration-200"
        onClick={() => onNavigate('orders')}
      >
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Pending Orders</h3>
          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div>
            <div className="text-2xl font-semibold mb-3">+{stats?.pending_orders || 0}</div>
            <div className="h-8 mt-4">
              <div className="flex items-center text-xs">
                {isOrdersTrendPositive ? 
                  <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" /> : 
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                }
                <span className={`${isOrdersTrendPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                  YTD
                </span>
              </div>
              <ResponsiveContainer width="100%" height={sparklineHeight}>
                <LineChart data={ordersTrend} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="ordersShadow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={areaColors.orders} stopOpacity={1}/>
                      <stop offset="100%" stopColor={areaColors.orders} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="none"
                    fill="url(#ordersShadow)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={lineColors.orders}
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Card>

      <Card 
        className="relative overflow-hidden bg-white p-6 hover:shadow-md transition-shadow duration-200"
        onClick={() => onNavigate('prescriptions')}
      >
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Prescriptions</h3>
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div>
            <div className="text-2xl font-semibold mb-3">+{stats?.total_prescriptions || 0}</div>
            <div className="h-8 mt-4">
              <div className="flex items-center text-xs">
                {isPrescriptionsTrendPositive ? 
                  <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" /> : 
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                }
                <span className={`${isPrescriptionsTrendPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                  YTD
                </span>
              </div>
              <ResponsiveContainer width="100%" height={sparklineHeight}>
                <LineChart data={prescriptionsTrend} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="prescriptionsShadow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={areaColors.prescriptions} stopOpacity={1}/>
                      <stop offset="100%" stopColor={areaColors.prescriptions} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="none"
                    fill="url(#prescriptionsShadow)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={lineColors.prescriptions}
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Card>

      <Card 
        className="relative overflow-hidden bg-white p-6 hover:shadow-md transition-shadow duration-200"
        onClick={() => fourthCardConfig.path ? onNavigate(fourthCardConfig.path) : null}
      >
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{fourthCardConfig.label}</h3>
          {fourthCardConfig.icon}
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div>
            <div className="text-2xl font-semibold mb-3">
              {userRole === 'patient' ? 
                `+${stats?.monthly_revenue || 0}` : 
                `€${stats?.monthly_revenue?.toLocaleString() || 0}`}
            </div>
            <div className="h-8 mt-4">
              <div className="flex items-center text-xs">
                {isRevenueTrendPositive ? 
                  <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" /> : 
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                }
                <span className={`${isRevenueTrendPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                  YTD
                </span>
              </div>
              <ResponsiveContainer width="100%" height={sparklineHeight}>
                <LineChart data={revenueTrend} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="revenueShadow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={areaColors.revenue} stopOpacity={1}/>
                      <stop offset="100%" stopColor={areaColors.revenue} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="none"
                    fill="url(#revenueShadow)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={lineColors.revenue}
                    strokeWidth={1.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DashboardStats;
