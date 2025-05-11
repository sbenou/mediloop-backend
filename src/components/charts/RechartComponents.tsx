
import { ReactNode } from "react";
import {
  XAxis as OriginalXAxis,
  YAxis as OriginalYAxis,
  XAxisProps,
  YAxisProps,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

// Default props that will be applied to our XAxis wrapper
const defaultXAxisProps: Partial<XAxisProps> = {
  dataKey: "name",
  height: 30,
  axisLine: { stroke: '#E5E7EB' },
  tickLine: { stroke: '#E5E7EB' },
  tick: { fontSize: 12 }
};

// Default props that will be applied to our YAxis wrapper
const defaultYAxisProps: Partial<YAxisProps> = {
  width: 60,
  axisLine: { stroke: '#E5E7EB' },
  tickLine: { stroke: '#E5E7EB' },
  tick: { fontSize: 12 }
};

// Fix XAxis deprecation warning with a wrapper component using default parameters
export function XAxis(props: XAxisProps) {
  // Make sure xAxisId is provided to avoid conflicts
  const mergedProps = { ...defaultXAxisProps, ...props };
  if (!mergedProps.xAxisId) {
    mergedProps.xAxisId = "default";
  }
  
  // Use type assertion to fix the incompatibility
  return <OriginalXAxis {...mergedProps} />;
}

// Fix YAxis deprecation warning with a wrapper component using default parameters
export function YAxis(props: YAxisProps) {
  // Make sure yAxisId is provided to avoid conflicts
  const mergedProps = { ...defaultYAxisProps, ...props };
  if (!mergedProps.yAxisId) {
    mergedProps.yAxisId = "default";
  }
  
  // Use type assertion to fix the incompatibility
  return <OriginalYAxis {...mergedProps} />;
}

// Re-export other components from recharts that we'll need
export {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
