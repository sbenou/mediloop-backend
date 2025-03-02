
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

// Mock data generator
const generateMockData = (type: "prescriptions" | "teleconsultations", timeFrame: TimeFrame) => {
  if (timeFrame === "current-month") {
    // Generate data for current month (4 weeks)
    return [
      { name: "Week 1", count: Math.floor(Math.random() * 10) },
      { name: "Week 2", count: Math.floor(Math.random() * 10) },
      { name: "Week 3", count: Math.floor(Math.random() * 10) },
      { name: "Week 4", count: Math.floor(Math.random() * 10) }
    ];
  } else {
    // Generate data for last 3 months
    return [
      { name: "Month 1", count: Math.floor(Math.random() * 25) },
      { name: "Month 2", count: Math.floor(Math.random() * 25) },
      { name: "Month 3", count: Math.floor(Math.random() * 25) }
    ];
  }
};

export const StatisticsCharts = () => {
  const [prescriptionsTimeFrame, setPrescriptionsTimeFrame] = useState<TimeFrame>("current-month");
  const [teleconsultationsTimeFrame, setTeleconsultationsTimeFrame] = useState<TimeFrame>("current-month");
  
  const prescriptionsData = generateMockData("prescriptions", prescriptionsTimeFrame);
  const teleconsultationsData = generateMockData("teleconsultations", teleconsultationsTimeFrame);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">Prescriptions</CardTitle>
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
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={prescriptionsData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Prescriptions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">Teleconsultations</CardTitle>
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
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={teleconsultationsData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
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
