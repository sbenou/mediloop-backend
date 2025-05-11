
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

// Fix XAxis wrapper component to properly handle types
export const XAxis = (props: XAxisProps) => {
  // Create a new props object with defaults and user props
  const combinedProps = {
    ...defaultXAxisProps,
    ...props,
    // Ensure xAxisId is provided
    xAxisId: props.xAxisId || "default"
  };
  
  // Return the original component with combined props
  return <OriginalXAxis {...combinedProps} />;
};

// Fix YAxis wrapper component to properly handle types
export const YAxis = (props: YAxisProps) => {
  // Create a new props object with defaults and user props
  const combinedProps = {
    ...defaultYAxisProps,
    ...props,
    // Ensure yAxisId is provided
    yAxisId: props.yAxisId || "default"
  };
  
  // Return the original component with combined props
  return <OriginalYAxis {...combinedProps} />;
};

// Re-export other components from recharts that we'll need
export {
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
