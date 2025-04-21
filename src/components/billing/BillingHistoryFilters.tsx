
import React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Calendar } from "lucide-react";

type PaymentStatus = "all" | "success" | "failed";

interface BillingHistoryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: PaymentStatus;
  onStatusFilterChange: (status: PaymentStatus) => void;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
}

const statusLabels: Record<PaymentStatus, string> = {
  all: "All",
  success: "Successful",
  failed: "Failed",
};

export const BillingHistoryFilters: React.FC<BillingHistoryFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateRange,
  onDateRangeChange,
}) => {
  // Example years for demonstration (current & last 3 years)
  const years = Array.from({ length: 4 }).map((_, i) => `${new Date().getFullYear() - i}`);

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 my-4 w-full">
      {/* Search */}
      <div className="flex items-center relative md:w-64 w-full">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search payments..."
          className="pl-8 w-full"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex flex-1 flex-wrap md:flex-nowrap gap-3 md:gap-4">
        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={v => onStatusFilterChange(v as PaymentStatus)}>
          <SelectTrigger className="w-36">
            <Filter className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Payment type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="success">Successful Payments</SelectItem>
            <SelectItem value="failed">Failed Payments</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <Select value={dateRange} onValueChange={onDateRangeChange}>
          <SelectTrigger className="w-36">
            <Calendar className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="last_3_months">Last 3 Months</SelectItem>
            <SelectItem value="last_6_months">Last 6 Months</SelectItem>
            <SelectItem value="this_year">This Year</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={year}>Year {year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default BillingHistoryFilters;
