
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

/**
 * A wrapper for the XAxis component with default styling
 */
export function XAxis(props: Omit<XAxisProps, 'ref'>) {
  // Use the spread operator to combine the default props with the user-provided props
  // This ensures the user props take precedence over defaults
  return (
    <OriginalXAxis
      {...defaultXAxisProps}
      {...props}
      xAxisId={props.xAxisId || "default"}
    />
  );
}

/**
 * A wrapper for the YAxis component with default styling
 */
export function YAxis(props: Omit<YAxisProps, 'ref'>) {
  // Use the spread operator to combine the default props with the user-provided props
  // This ensures the user props take precedence over defaults
  return (
    <OriginalYAxis
      {...defaultYAxisProps}
      {...props}
      yAxisId={props.yAxisId || "default"}
    />
  );
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
