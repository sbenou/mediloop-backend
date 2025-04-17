
import { ReactNode } from "react";
import {
  XAxis as OriginalXAxis,
  YAxis as OriginalYAxis,
  XAxisProps,
  YAxisProps
} from "recharts";

// Default props that will be applied to our XAxis wrapper
// Remove xAxisId from default props to avoid conflicts
const defaultXAxisProps = {
  dataKey: "name",
  height: 30,
  axisLine: { stroke: '#E5E7EB' },
  tickLine: { stroke: '#E5E7EB' },
  tick: { fontSize: 12 }
};

// Default props that will be applied to our YAxis wrapper
// Remove yAxisId from default props to avoid conflicts
const defaultYAxisProps = {
  width: 60,
  axisLine: { stroke: '#E5E7EB' },
  tickLine: { stroke: '#E5E7EB' },
  tick: { fontSize: 12 }
};

// Fix XAxis deprecation warning with a wrapper component using default parameters
export function XAxis(props: XAxisProps) {
  // Merge provided props with defaults
  // Ensure we don't use xAxisId unless explicitly provided
  return <OriginalXAxis {...defaultXAxisProps} {...props} />;
}

// Fix YAxis deprecation warning with a wrapper component using default parameters
export function YAxis(props: YAxisProps) {
  // Merge provided props with defaults
  // Ensure we don't use yAxisId unless explicitly provided
  return <OriginalYAxis {...defaultYAxisProps} {...props} />;
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
