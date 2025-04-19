
import { ReactNode } from "react";
import {
  XAxis as OriginalXAxis,
  YAxis as OriginalYAxis,
  XAxisProps,
  YAxisProps
} from "recharts";

// Default props that will be applied to our XAxis wrapper
const defaultXAxisProps = {
  dataKey: "name",
  height: 30,
  axisLine: { stroke: '#E5E7EB' },
  tickLine: { stroke: '#E5E7EB' },
  tick: { fontSize: 12 }
};

// Default props that will be applied to our YAxis wrapper
const defaultYAxisProps = {
  width: 60,
  axisLine: { stroke: '#E5E7EB' },
  tickLine: { stroke: '#E5E7EB' },
  tick: { fontSize: 12 }
};

// Fix XAxis deprecation warning with a wrapper component using default parameters
export function XAxis(props: XAxisProps) {
  // Make sure xAxisId is undefined by default to avoid conflicts
  const mergedProps = { ...props };
  if (!mergedProps.xAxisId) {
    mergedProps.xAxisId = "default";
  }
  return <OriginalXAxis {...defaultXAxisProps} {...mergedProps} />;
}

// Fix YAxis deprecation warning with a wrapper component using default parameters
export function YAxis(props: YAxisProps) {
  // Make sure yAxisId is undefined by default to avoid conflicts
  const mergedProps = { ...props };
  if (!mergedProps.yAxisId) {
    mergedProps.yAxisId = "default";
  }
  return <OriginalYAxis {...defaultYAxisProps} {...mergedProps} />;
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
