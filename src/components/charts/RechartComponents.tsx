
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

// Changed from function component to simpler composition pattern
// to resolve ref type issues
export const XAxis = (props: Omit<XAxisProps, 'ref'>) => {
  const mergedProps = {
    ...defaultXAxisProps,
    ...props,
    // Ensure xAxisId gets set properly, prioritizing user props if provided
    xAxisId: props.xAxisId || "default"
  };
  
  // @ts-ignore - Explicitly ignore TypeScript errors related to ref handling
  return <OriginalXAxis {...mergedProps} />;
};

// Changed from function component to simpler composition pattern
// to resolve ref type issues
export const YAxis = (props: Omit<YAxisProps, 'ref'>) => {
  const mergedProps = {
    ...defaultYAxisProps,
    ...props,
    // Ensure yAxisId gets set properly, prioritizing user props if provided
    yAxisId: props.yAxisId || "default"
  };
  
  // @ts-ignore - Explicitly ignore TypeScript errors related to ref handling
  return <OriginalYAxis {...mergedProps} />;
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
