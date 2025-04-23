
import { Card } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Users } from "lucide-react";

interface PatientsGoalCardProps {
  total: number;
  goal: number;
  percentChange: number;
  isPositive: boolean;
}

const PatientsGoalCard = ({ total, goal, percentChange, isPositive }: PatientsGoalCardProps) => {
  const progress = (total / goal) * 100;

  return (
    <Card className="relative overflow-hidden bg-white p-6 shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Active Patients</h3>
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
          <Users className="h-4 w-4 text-blue-600" />
        </div>
      </div>
      <div className="pt-2">
        <div className="text-2xl font-semibold mb-3">+{total.toLocaleString()}</div>
        <div className="flex items-center text-xs mb-2">
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
          )}
          <span className={isPositive ? "text-emerald-500" : "text-red-500"}>
            {percentChange}% YTD
          </span>
        </div>
        <div className="mt-4">
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
            Goal: {goal.toLocaleString()} patients
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PatientsGoalCard;
