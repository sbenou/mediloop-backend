import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, ShoppingBag, FileText, CreditCard, TrendingUp, TrendingDown,
  Activity, MessageCircle, Video, Bell, Share
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Area 
} from "recharts";
import { Button } from "@/components/ui/button";

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
        icon: <Users className="h-5 w-5 text-muted-foreground" />,
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
        icon: <CreditCard className="h-5 w-5 text-muted-foreground" />,
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

  const getPremiumContent = (role: string) => {
    switch(role) {
      case 'doctor':
        return {
          title: "Upgrade to Doctor Pro",
          description: "Access advanced telemedicine features and patient analytics",
          image: "/lovable-uploads/ab37fc95-08f9-46e5-b625-5ed4085e65d0.png", // Doctor with medical icons
          buttonText: "Enhance Your Practice"
        };
      case 'pharmacist':
        return {
          title: "Upgrade to Pharmacy Plus",
          description: "Streamline operations with advanced inventory and prescription management",
          image: "/lovable-uploads/2e347c1d-4330-466b-b798-7c68a262f812.png", // Pharmacist at desk
          buttonText: "Boost Your Pharmacy"
        };
      default: // patient
        return {
          title: "Upgrade to Health Plus",
          description: "Get priority access to doctors and exclusive health services",
          image: "/lovable-uploads/27b7ec08-9cac-46b6-9641-e95a33834436.png", // Patient with doctor
          buttonText: "Upgrade Now"
        };
    }
  };

  const premiumContent = getPremiumContent(userRole);

  // Mock data for Healthcare Stats
  const healthcareStats = {
    teleconsultations: {
      active: 5,
      trend: isPatientTrendPositive,
      color: "bg-blue-100 text-blue-600"
    },
    consultations: {
      active: 3,
      trend: isPrescriptionsTrendPositive,
      color: "bg-violet-100 text-violet-600"
    },
    prescriptions: {
      active: stats?.total_prescriptions || 8,
      trend: isPrescriptionsTrendPositive,
      color: "bg-green-100 text-green-600"
    }
  };

  // Mock data for Recent Activities
  const recentActivities = [
    { type: "Consultation", status: "Scheduled", date: "Today, 2:00 PM" },
    { type: "Prescription", status: "Renewed", date: "Yesterday" },
    { type: "Order", status: "Delivered", date: "Apr 21, 2025" }
  ];

  // Mock data for Referrals
  const referrals = {
    count: 12,
    points: 1200,
    redeemed: 500
  };

  // Calculate progress for the patients goal chart
  const progress = (patientsCount / patientsGoal) * 100;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Top Row - Premium Ad + Healthcare Stats */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 p-6 shadow-sm border-0 text-white md:col-span-1 lg:col-span-2">
        <div className="flex justify-between items-start h-full">
          <div className="flex-1 pr-4 max-w-xs">
            <h3 className="text-2xl font-semibold mb-2">{premiumContent.title}</h3>
            <p className="text-blue-100 mb-4 text-sm">{premiumContent.description}</p>
            <Button 
              className="bg-white text-blue-600 hover:bg-blue-50"
              onClick={() => onNavigate('upgrade')}
            >
              {premiumContent.buttonText}
            </Button>
          </div>
          <img 
            src={premiumContent.image}
            alt="Healthcare illustration"
            className="w-48 h-48 object-contain"
          />
        </div>
      </Card>
      
      {/* Healthcare Stats Card */}
      <Card className="relative overflow-hidden bg-white p-6 shadow-sm border-0 md:col-span-1 lg:col-span-2">
        <h3 className="text-lg font-medium mb-4">Healthcare Overview</h3>
        <div className="grid grid-cols-3 gap-4">
          {/* Teleconsultations */}
          <div className="flex flex-col items-center">
            <div className={`h-12 w-12 rounded-full ${healthcareStats.teleconsultations.color} flex items-center justify-center mb-2`}>
              <Video className="h-6 w-6" />
            </div>
            <div className="text-sm text-center">
              <p className="text-xl font-semibold">{healthcareStats.teleconsultations.active}</p>
              <p className="text-xs text-muted-foreground">Active Teleconsultations</p>
            </div>
            <div className="flex items-center text-xs mt-1">
              {healthcareStats.teleconsultations.trend ? 
                <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" /> : 
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              }
            </div>
          </div>
          
          {/* Consultations */}
          <div className="flex flex-col items-center">
            <div className={`h-12 w-12 rounded-full ${healthcareStats.consultations.color} flex items-center justify-center mb-2`}>
              <MessageCircle className="h-6 w-6" />
            </div>
            <div className="text-sm text-center">
              <p className="text-xl font-semibold">{healthcareStats.consultations.active}</p>
              <p className="text-xs text-muted-foreground">Active Consultations</p>
            </div>
            <div className="flex items-center text-xs mt-1">
              {healthcareStats.consultations.trend ? 
                <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" /> : 
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              }
            </div>
          </div>
          
          {/* Prescriptions */}
          <div className="flex flex-col items-center">
            <div className={`h-12 w-12 rounded-full ${healthcareStats.prescriptions.color} flex items-center justify-center mb-2`}>
              <FileText className="h-6 w-6" />
            </div>
            <div className="text-sm text-center">
              <p className="text-xl font-semibold">{healthcareStats.prescriptions.active}</p>
              <p className="text-xs text-muted-foreground">Active Prescriptions</p>
            </div>
            <div className="flex items-center text-xs mt-1">
              {healthcareStats.prescriptions.trend ? 
                <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" /> : 
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              }
            </div>
          </div>
        </div>
      </Card>

      {/* Transactions Card */}
      <Card className="relative overflow-hidden bg-white p-6 shadow-sm border-0 md:col-span-1 lg:col-span-2">
        <h3 className="text-lg font-medium mb-4">Transactions</h3>
        
        {/* Pending Orders */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-orange-600" />
              </div>
              <span className="text-sm font-medium">Pending Orders</span>
            </div>
            <span className="text-xl font-semibold">+{stats?.pending_orders || 0}</span>
          </div>
          <div className="h-12">
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
        
        {/* Completed Payments */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm font-medium">
                {userRole === 'patient' ? 'Completed Payments' : 'Monthly Revenue'}
              </span>
            </div>
            <span className="text-xl font-semibold">
              {userRole === 'patient' ? 
                `+${stats?.monthly_revenue || 0}` : 
                `€${stats?.monthly_revenue?.toLocaleString() || 0}`}
            </span>
          </div>
          <div className="h-12">
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
      </Card>
      
      {userRole === 'doctor' ? (
        <>
          {/* Active Patients Card - Direct implementation without nested PatientsGoalCard */}
          <Card className="relative overflow-hidden bg-white p-6 shadow-sm border-0 md:col-span-1 lg:col-span-1">
            <h3 className="text-lg font-medium mb-3">Active Patients</h3>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs text-muted-foreground">Total Patients</p>
                  <p className="text-xl font-semibold">{stats?.total_patients || 0}</p>
                </div>
                <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-3.5 w-3.5 text-blue-600" />
                </div>
              </div>
              
              {/* Patient Goal Chart - directly integrated */}
              <div>
                <div className="flex items-center text-xs mb-2">
                  {patientsPercentChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={patientsPercentChange >= 0 ? "text-emerald-500" : "text-red-500"}>
                    {patientsPercentChange}% YTD
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500 ease-in-out"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Goal: {patientsGoal.toLocaleString()} patients
                  </div>
                </div>
              </div>
              
              <div className="mt-auto">
                <Button 
                  variant="ghost" 
                  className="w-full text-sm text-[#7E69AB] hover:text-[#7E69AB] hover:bg-[#7E69AB]/10"
                  onClick={() => onNavigate('patients')}
                >
                  View All
                  <Activity className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Recent Activities Card */}
          <Card className="relative overflow-hidden bg-white p-6 shadow-sm border-0 md:col-span-1 lg:col-span-1">
            <h3 className="text-lg font-medium mb-3">Recent Activities</h3>
            <div className="space-y-3 flex flex-col h-[calc(100%-80px)]">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{activity.type}</p>
                    <p className="text-xs text-muted-foreground">{activity.status}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">{activity.date}</div>
                </div>
              ))}
              
              <div className="mt-auto">
                <Button 
                  variant="ghost" 
                  className="w-full text-sm text-[#7E69AB] hover:text-[#7E69AB] hover:bg-[#7E69AB]/10"
                  onClick={() => onNavigate('notifications')}
                >
                  View All
                  <Activity className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* Recent Activities Card */}
          <Card className="relative overflow-hidden bg-white p-6 shadow-sm border-0 md:col-span-1 lg:col-span-1">
            <h3 className="text-lg font-medium mb-3">Recent Activities</h3>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{activity.type}</p>
                    <p className="text-xs text-muted-foreground">{activity.status}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">{activity.date}</div>
                </div>
              ))}
            </div>
            <Button 
              variant="ghost" 
              className="w-full mt-3 text-sm"
              onClick={() => onNavigate('notifications')}
            >
              View All
              <Activity className="ml-2 h-4 w-4" />
            </Button>
          </Card>
          
          {/* Referrals Card */}
          <Card className="relative overflow-hidden bg-white p-6 shadow-sm border-0 md:col-span-1 lg:col-span-1">
            <h3 className="text-lg font-medium mb-3">Referrals</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Referrals</p>
                  <p className="text-xl font-semibold">{referrals.count}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Share className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Points</p>
                  <p className="text-xl font-semibold">{referrals.points}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Redeemed</p>
                  <p className="text-sm font-medium">{referrals.redeemed}</p>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full mt-4 text-sm"
              onClick={() => onNavigate('referral')}
            >
              View Referrals
              <Share className="ml-2 h-4 w-4" />
            </Button>
          </Card>
        </>
      )}

      {showPatientsGoal && userRole !== 'doctor' && (
        <Card className="relative overflow-hidden bg-white p-6 shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
          <div className="flex flex-row items-center justify-between space-y-0 pb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Patients</h3>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="pt-4 space-y-4">
            <div className="text-2xl font-semibold">+{patientsCount.toLocaleString()}</div>
            <div className="space-y-2">
              <div className="flex items-center text-xs">
                {patientsPercentChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={patientsPercentChange >= 0 ? "text-emerald-500" : "text-red-500"}>
                  {patientsPercentChange}% YTD
                </span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 ease-in-out"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Goal: {patientsGoal.toLocaleString()} patients
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Button 
                variant="ghost" 
                className="w-full text-sm text-[#7E69AB] hover:text-[#7E69AB] hover:bg-[#7E69AB]/10"
                onClick={() => onNavigate('patients')}
              >
                View All
                <Activity className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DashboardStats;
