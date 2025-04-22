
import React from "react";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

interface PatientsGoalCardProps {
  total: number;
  goal: number;
  percentChange: number;
  isPositive?: boolean;
}

const PatientsGoalCard: React.FC<PatientsGoalCardProps> = ({
  total,
  goal,
  percentChange,
  isPositive = true,
}) => {
  // Calculate percent relative to goal
  const progressPercent = Math.min(100, Math.round((total / goal) * 100));
  return (
    <Card className="relative bg-white border rounded-lg shadow-sm p-5 flex flex-col justify-between min-h-[180px]">
      <div className="text-xs text-muted-foreground mb-1">Month to date</div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-medium">Active Patients Goal</h3>
        <Users className="h-5 w-5 text-purple-500" />
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-bold text-red-500">
          {progressPercent}%
        </span>
      </div>
      <div className="flex items-center mb-2">
        <span className="text-lg font-semibold mr-2 text-gray-800">{total.toLocaleString()}</span>
        <span className="ml-1 text-xs font-medium text-muted-foreground flex items-center">
          / {goal.toLocaleString()}
        </span>
      </div>
      {/* Progress Bar */}
      <div className="relative h-3 mb-1.5 rounded-full bg-purple-100 overflow-hidden">
        <div
          className="h-full bg-purple-400 transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {/* Footer: Social and % */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center text-sm text-[#7F54B3] font-medium gap-1">
          <span className="w-5 h-5 inline-flex items-center justify-center rounded-full bg-purple-100 mr-1">
            <svg width="16" height="16" viewBox="0 0 512 512"><circle cx="256" cy="256" r="256" fill="#7F54B3"/></svg>
          </span>
          My Platform
        </div>
        <span
          className={
            "px-2 py-0.5 rounded text-xs font-semibold ml-4 flex items-center gap-1 " +
            (isPositive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")
          }
        >
          <svg width="13" height="13" className="mr-0.5" viewBox="0 0 20 20">
            <path
              d={isPositive ? "M10.293 3.293a1 1 0 0 1 1.414 0l7 7a1 1 0 0 1-1.414 1.414L11 6.414V17a1 1 0 1 1-2 0V6.414l-6.293 6.293A1 1 0 0 1 1.293 10.707l7-7z" : "M9 17a1 1 0 1 0 2 0V6.414l6.293 6.293a1 1 0 0 0 1.414-1.414l-7-7a1 1 0 0 0-1.414 0l-7 7A1 1 0 0 0 4.707 12.707L11 6.414V17z"}
              fill={isPositive ? "#22c55e" : "#ef4444"}
            />
          </svg>
          {isPositive && "+"}{percentChange.toFixed(1)}%
        </span>
      </div>
    </Card>
  );
};
export default PatientsGoalCard;
