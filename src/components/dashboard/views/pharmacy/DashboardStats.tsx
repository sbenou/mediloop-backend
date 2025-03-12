import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ShoppingBag, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line,
  BarChart,
  Bar
} from "recharts";

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
}

// Mock data for sparklines if real data is not provided
const generateMockTrendData = (trend: number = 1) => {
  const direction = Math.random() > 0.5 ? 1 : -1;
  return Array(6).fill(0).map(() => ({
    value: Math.floor(3 + Math.random() * 12 * direction * trend)
  }));
};

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, isLoading, onNavigate }) => {
  // Generate mock data for trends if not provided
  const patientTrend = stats?.patient_trend || generateMockTrendData(1);
  const ordersTrend = stats?.orders_trend || generateMockTrendData(-0.5);
  const prescriptionsTrend = stats?.prescriptions_trend || generateMockTrendData(0.8);
  const revenueTrend = stats?.revenue_trend || generateMockTrendData(1.2);
  
  // Determine if trends are positive
  const isPatientTrendPositive = patientTrend[0].value < patientTrend[patientTrend.length - 1].value;
  const isOrdersTrendPositive = ordersTrend[0].value < ordersTrend[ordersTrend.length - 1].value;
  const isPrescriptionsTrendPositive = prescriptionsTrend[0].value < prescriptionsTrend[prescriptionsTrend.length - 1].value;
  const isRevenueTrendPositive = revenueTrend[0].value < revenueTrend[revenueTrend.length - 1].value;
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card 
        className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onNavigate('patients')}
      >
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Active Patients</h3>
          <Users className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="pt-2">
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div>
              <div className="text-2xl font-bold">+{stats?.total_patients || 0}</div>
              <div className="h-8 mt-1">
                <div className="flex items-center">
                  {isPatientTrendPositive ? 
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> : 
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  }
                  <span className={`text-xs ${isPatientTrendPositive ? 'text-green-500' : 'text-red-500'}`}>
                    YTD
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={20}>
                  <LineChart data={patientTrend}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#2196F3" 
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={true}
                      connectNulls={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </Card>
      
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
              <div className="text-2xl font-bold">+{stats?.pending_orders || 0}</div>
              <div className="h-8 mt-1">
                <div className="flex items-center">
                  {isOrdersTrendPositive ? 
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> : 
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  }
                  <span className={`text-xs ${isOrdersTrendPositive ? 'text-green-500' : 'text-red-500'}`}>
                    YTD
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={20}>
                  <LineChart data={ordersTrend}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#2196F3" 
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={true}
                      connectNulls={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </Card>
      
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
              <div className="text-2xl font-bold">+{stats?.total_prescriptions || 0}</div>
              <div className="h-8 mt-1">
                <div className="flex items-center">
                  {isPrescriptionsTrendPositive ? 
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> : 
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  }
                  <span className={`text-xs ${isPrescriptionsTrendPositive ? 'text-green-500' : 'text-red-500'}`}>
                    YTD
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={20}>
                  <LineChart data={prescriptionsTrend}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#2196F3" 
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={true}
                      connectNulls={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      <Card className="bg-white border rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium">Monthly Revenue</h3>
          <span className="text-muted-foreground">€</span>
        </div>
        <div className="pt-2">
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div>
              <div className="text-2xl font-bold">€{stats?.monthly_revenue?.toLocaleString() || 0}</div>
              <div className="h-8 mt-1">
                <div className="flex items-center">
                  {isRevenueTrendPositive ? 
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> : 
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  }
                  <span className={`text-xs ${isRevenueTrendPositive ? 'text-green-500' : 'text-red-500'}`}>
                    YTD
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={20}>
                  <LineChart data={revenueTrend}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#2196F3" 
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={true}
                      connectNulls={true}
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
