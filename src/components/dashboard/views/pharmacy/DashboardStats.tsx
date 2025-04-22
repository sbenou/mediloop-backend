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
    // Add trend data for sparklines
    patient_trend?: Array<{ value: number }>;
    orders_trend?: Array<{ value: number }>;
    prescriptions_trend?: Array<{ value: number }>;
    revenue_trend?: Array<{ value: number }>;
  } | null;
  isLoading: boolean;
  onNavigate: (path: string) => void;
  userRole?: string;
}

// Mock data generator with more dramatic variations
const generateMockTrendData = (trend: number = 1) => {
  // Create an array of 6 points with more dramatic variations
  return Array(6).fill(0).map(() => ({
    value: Math.floor(
      (Math.random() < 0.5 ? -1 : 1) * // Randomly make values positive or negative
      (5 + Math.random() * 20) * trend // Larger range for more dramatic changes
    )
  }));
};

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, isLoading, onNavigate, userRole = 'pharmacist' }) => {
  // Generate mock data for trends if not provided
  const patientTrend = stats?.patient_trend || generateMockTrendData(1);
  const ordersTrend = stats?.orders_trend || generateMockTrendData(-0.5);
  const prescriptionsTrend = stats?.prescriptions_trend || generateMockTrendData(0.8);
  const revenueTrend = stats?.revenue_trend || generateMockTrendData(1.2);

  const isPatientTrendPositive = patientTrend[0].value < patientTrend[patientTrend.length - 1].value;
  const isOrdersTrendPositive = ordersTrend[0].value < ordersTrend[ordersTrend.length - 1].value;
  const isPrescriptionsTrendPositive = prescriptionsTrend[0].value < prescriptionsTrend[prescriptionsTrend.length - 1].value;
  const isRevenueTrendPositive = revenueTrend[0].value < revenueTrend[revenueTrend.length - 1].value;

  // Adjust labels and icons based on user role
  const firstCardConfig = userRole === 'patient' 
    ? { 
        label: 'Active Teleconsultations', 
        icon: <Video className="h-5 w-5 text-muted-foreground" />,
        path: 'teleconsultations'
      }
    : null; // REMOVE the "Active Patients" card for doctor/pharmacist, PatientsGoalCard used instead

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

  // Show the PatientsGoalCard if doctor or pharmacist
  const showPatientsGoal = userRole === "doctor" || userRole === "pharmacist";
  const patientsGoal = 30000;
  const patientsCount = stats?.total_patients || 0;
  const patientsPercentChange = 4.8; // Replace with real change calc if available.

  // COLORS for sparklines with more saturated and prominent gradient shadows
  const lineColors = {
    patients: "#37B079", // green
    orders: "#F97316", // orange
    prescriptions: "#7c3aed", // vivid purple
    revenue: "#2563eb" // blue
  };

  // More prominent and taller area colors for shadows
  const areaColors = {
    patients: "rgba(55, 176, 121, 0.50)",          // increased opacity and saturation
    orders: "rgba(249, 115, 22, 0.40)",
    prescriptions: "rgba(124, 58, 237, 0.45)",
    revenue: "rgba(37, 99, 235, 0.48)"
  };

  // Increased height for sparkline shadows
  const sparklineHeight = 48; // Increased from 38 to make shadows more prominent

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

      {/* Patients Card */}
      {firstCardConfig && (
        <Card 
          className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate(firstCardConfig.path)}
        >
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">{firstCardConfig.label}</h3>
            {firstCardConfig.icon}
          </div>
          <div className="pt-2">
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div>
                <div className="text-2xl font-bold mb-3">+{stats?.total_patients || 0}</div>
                <div className="h-8 mt-2 mb-1">
                  <div className="flex items-center mb-2">
                    {isPatientTrendPositive ? 
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> : 
                      <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                    }
                    <span className={`text-xs ${isPatientTrendPositive ? 'text-green-500' : 'text-red-500'}`}>
                      YTD
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={sparklineHeight}>
                    <LineChart data={patientTrend}>
                      <defs>
                        <linearGradient id="patientsShadow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={areaColors.patients} stopOpacity={0.85}/>
                          <stop offset="98%" stopColor={areaColors.patients} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="none"
                        fill="url(#patientsShadow)"
                        fillOpacity={1}
                        isAnimationActive={true}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={lineColors.patients}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                        connectNulls={true}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Orders Card */}
      <Card 
        className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onNavigate('orders')}
      >
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Pending Orders</h3>
          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="pt-2">
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div>
              <div className="text-2xl font-bold mb-3">+{stats?.pending_orders || 0}</div>
              <div className="h-8 mt-2 mb-1">
                <div className="flex items-center mb-2">
                  {isOrdersTrendPositive ? 
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> : 
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  }
                  <span className={`text-xs ${isOrdersTrendPositive ? 'text-green-500' : 'text-red-500'}`}>
                    YTD
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={sparklineHeight}>
                  <LineChart data={ordersTrend}>
                    <defs>
                      <linearGradient id="ordersShadow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={areaColors.orders} stopOpacity={0.85}/>
                        <stop offset="98%" stopColor={areaColors.orders} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="none"
                      fill="url(#ordersShadow)"
                      fillOpacity={1}
                      isAnimationActive={true}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={lineColors.orders}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={true}
                      connectNulls={true}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Prescriptions Card */}
      <Card 
        className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onNavigate('prescriptions')}
      >
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Prescriptions</h3>
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="pt-2">
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div>
              <div className="text-2xl font-bold mb-3">+{stats?.total_prescriptions || 0}</div>
              <div className="h-8 mt-2 mb-1">
                <div className="flex items-center mb-2">
                  {isPrescriptionsTrendPositive ? 
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> : 
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  }
                  <span className={`text-xs ${isPrescriptionsTrendPositive ? 'text-green-500' : 'text-red-500'}`}>
                    YTD
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={sparklineHeight}>
                  <LineChart data={prescriptionsTrend}>
                    <defs>
                      <linearGradient id="prescriptionsShadow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={areaColors.prescriptions} stopOpacity={0.85}/>
                        <stop offset="98%" stopColor={areaColors.prescriptions} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="none"
                      fill="url(#prescriptionsShadow)"
                      fillOpacity={1}
                      isAnimationActive={true}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={lineColors.prescriptions}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={true}
                      connectNulls={true}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Revenue/Payments Card */}
      <Card 
        className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => fourthCardConfig.path ? onNavigate(fourthCardConfig.path) : null}
      >
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">{fourthCardConfig.label}</h3>
          {fourthCardConfig.icon}
        </div>
        <div className="pt-2">
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div>
              <div className="text-2xl font-bold mb-3">
                {userRole === 'patient' ? 
                  `+${stats?.monthly_revenue || 0}` : 
                  `€${stats?.monthly_revenue?.toLocaleString() || 0}`}
              </div>
              <div className="h-8 mt-2 mb-1">
                <div className="flex items-center mb-2">
                  {isRevenueTrendPositive ? 
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> : 
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  }
                  <span className={`text-xs ${isRevenueTrendPositive ? 'text-green-500' : 'text-red-500'}`}>
                    YTD
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={sparklineHeight}>
                  <LineChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="revenueShadow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={areaColors.revenue} stopOpacity={0.85}/>
                        <stop offset="98%" stopColor={areaColors.revenue} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="none"
                      fill="url(#revenueShadow)"
                      fillOpacity={1}
                      isAnimationActive={true}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={lineColors.revenue}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={true}
                      connectNulls={true}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DashboardStats;
