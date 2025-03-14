
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleCheck, CircleAlert, CircleX, AlertTriangle } from "lucide-react";

// Health indicator types
export type HealthState = "good" | "attention" | "critical";

interface HealthIndicator {
  name: string;
  state: HealthState;
  value: string;
  description: string;
}

// Generate fake health indicators
const generateHealthIndicators = (): HealthIndicator[] => {
  return [
    {
      name: "Blood Pressure",
      state: "good",
      value: "120/80 mmHg",
      description: "Within healthy range"
    },
    {
      name: "Blood Glucose",
      state: "attention",
      value: "142 mg/dL",
      description: "Slightly elevated, monitor closely"
    },
    {
      name: "Medication Adherence",
      state: "good",
      value: "95%",
      description: "Taking medications as prescribed"
    },
    {
      name: "Weight",
      state: "attention",
      value: "BMI 27.5",
      description: "Slightly overweight"
    },
    {
      name: "Activity Level",
      state: "critical",
      value: "Low",
      description: "Below recommended daily activity"
    }
  ];
};

interface HealthStateIndicatorProps {
  userRole: string | null;
}

const HealthStateIndicator: React.FC<HealthStateIndicatorProps> = ({ userRole }) => {
  // Only display for patients, not for doctors viewing dashboard
  if (userRole !== 'patient') {
    return null;
  }

  const healthIndicators = generateHealthIndicators();
  
  // Calculate overall health state
  const stateCount = {
    good: healthIndicators.filter(i => i.state === "good").length,
    attention: healthIndicators.filter(i => i.state === "attention").length,
    critical: healthIndicators.filter(i => i.state === "critical").length
  };
  
  let overallState: HealthState = "good";
  if (stateCount.critical > 0) {
    overallState = "critical";
  } else if (stateCount.attention > 1) {
    overallState = "attention";
  }

  const getStateColor = (state: HealthState): string => {
    switch (state) {
      case "good":
        return "bg-[#F2FCE2] text-green-700";
      case "attention":
        return "bg-[#FEF7CD] text-yellow-700";
      case "critical":
        return "bg-[#FEC6A1] text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStateIcon = (state: HealthState) => {
    switch (state) {
      case "good":
        return <CircleCheck className="h-5 w-5 text-green-500" />;
      case "attention":
        return <CircleAlert className="h-5 w-5 text-yellow-500" />;
      case "critical":
        return <CircleX className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Health State</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm">Overall:</span>
          {getStateIcon(overallState)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthIndicators.map((indicator, index) => (
          <Card key={index} className={`border-l-4 ${
            indicator.state === "good" ? "border-l-green-500" : 
            indicator.state === "attention" ? "border-l-yellow-500" : 
            "border-l-red-500"
          }`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">{indicator.name}</CardTitle>
                {getStateIcon(indicator.state)}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col">
                <span className="text-xl font-semibold">{indicator.value}</span>
                <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block w-fit ${getStateColor(indicator.state)}`}>
                  {indicator.description}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HealthStateIndicator;
