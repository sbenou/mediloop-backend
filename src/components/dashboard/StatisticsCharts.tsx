
import { useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

type TimeFrame = "current-month" | "last-3-months";

// Mock data generator with more dramatic variations
const generateMockData = (type: "prescriptions" | "teleconsultations", timeFrame: TimeFrame) => {
  const generateDramaticValue = (base: number, variance: number) => {
    return Math.floor(base + (Math.random() < 0.5 ? -1 : 1) * Math.random() * variance);
  };

  if (timeFrame === "current-month") {
    // Generate more dramatically varied data for current month (4 weeks)
    return [
      { name: "Week 1", count: type === "prescriptions" ? generateDramaticValue(10, 20) : generateDramaticValue(8, 15) },
      { name: "Week 2", count: type === "prescriptions" ? generateDramaticValue(10, 20) : generateDramaticValue(8, 15) },
      { name: "Week 3", count: type === "prescriptions" ? generateDramaticValue(10, 20) : generateDramaticValue(8, 15) },
      { name: "Week 4", count: type === "prescriptions" ? generateDramaticValue(10, 20) : generateDramaticValue(8, 15) }
    ];
  } else {
    // Generate more dramatically varied data for last 3 months
    return [
      { name: "Month 1", count: type === "prescriptions" ? generateDramaticValue(20, 30) : generateDramaticValue(15, 25) },
      { name: "Month 2", count: type === "prescriptions" ? generateDramaticValue(20, 30) : generateDramaticValue(15, 25) },
      { name: "Month 3", count: type === "prescriptions" ? generateDramaticValue(20, 30) : generateDramaticValue(15, 25) }
    ];
  }
};

export const StatisticsCharts = () => {
  const [prescriptionsTimeFrame, setPrescriptionsTimeFrame] = useState<TimeFrame>("current-month");
  const [teleconsultationsTimeFrame, setTeleconsultationsTimeFrame] = useState<TimeFrame>("current-month");
  
  const prescriptionsData = generateMockData("prescriptions", prescriptionsTimeFrame);
  const teleconsultationsData = generateMockData("teleconsultations", teleconsultationsTimeFrame);
  
  // Log the data to verify it's being generated
  console.log("Prescriptions data:", prescriptionsData);
  console.log("Teleconsultations data:", teleconsultationsData);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium text-primary">Prescriptions</CardTitle>
          <Select 
            value={prescriptionsTimeFrame} 
            onValueChange={(value) => setPrescriptionsTimeFrame(value as TimeFrame)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={prescriptionsData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name"
                  height={30}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={{ stroke: '#E5E7EB' }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  width={60}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={{ stroke: '#E5E7EB' }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Prescriptions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium text-primary">Teleconsultations</CardTitle>
          <Select 
            value={teleconsultationsTimeFrame} 
            onValueChange={(value) => setTeleconsultationsTimeFrame(value as TimeFrame)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={teleconsultationsData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name"
                  height={30}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={{ stroke: '#E5E7EB' }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  width={60}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={{ stroke: '#E5E7EB' }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" name="Teleconsultations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
