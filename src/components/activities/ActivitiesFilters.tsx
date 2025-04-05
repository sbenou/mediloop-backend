
import React, { useState, useMemo } from "react";
import { ActivityType } from "@/components/activity/ActivityItem";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Grid, List, Search, X, Calendar, Filter, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface ActivitiesFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: "all" | ActivityType;
  onFilterChange: (filter: "all" | ActivityType) => void;
  activityTypes: ActivityType[];
  view: "table" | "card";
  onViewChange: (view: "table" | "card") => void;
  sortBy: "newest" | "oldest" | "type";
  onSortChange: (sortBy: "newest" | "oldest" | "type") => void;
  selectedFilters?: ActivityType[];
  onSelectFilter?: (type: ActivityType) => void;
  onRemoveFilter?: (type: ActivityType) => void;
  onClearFilters?: () => void;
  dateRange?: string;
  onDateRangeChange?: (range: string) => void;
  renderViewToggle?: (currentView: "table" | "card", onChange: (view: "table" | "card") => void) => React.ReactNode;
  activeView?: "activities" | "notifications"; // New prop for determining the active view
  alertsOnly?: boolean; // New prop to filter alerts only
  onAlertsOnlyChange?: (alertsOnly: boolean) => void; // Handler for alerts toggle
}

export const ActivitiesFilters: React.FC<ActivitiesFiltersProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  activityTypes,
  view,
  onViewChange,
  sortBy,
  onSortChange,
  selectedFilters = [],
  onSelectFilter = () => {},
  onRemoveFilter = () => {},
  onClearFilters = () => {},
  dateRange,
  onDateRangeChange = () => {},
  renderViewToggle,
  activeView = "activities", // Default to activities view
  alertsOnly = false,
  onAlertsOnlyChange = () => {},
}) => {
  // For type filter dropdown state
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);

  // Generate available years dynamically, from user registration year to current year
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    
    // TODO: In a real implementation, we would fetch the user's registration date
    // and use that year as the starting point
    const registrationYear = currentYear; // For now, we only show current year
    
    const years = [];
    for (let year = currentYear; year >= registrationYear; year--) {
      years.push(year.toString());
    }
    return years;
  }, []);
  
  // Determine labels based on active view
  const getSearchPlaceholder = () => {
    return activeView === "activities" 
      ? "Search activities..." 
      : "Search notifications and alerts...";
  };
  
  const getFilterLabel = () => {
    return activeView === "activities" 
      ? "Activity Types" 
      : "Notification Types";
  };

  // Current year as a string for comparison
  const currentYear = new Date().getFullYear().toString();

  return (
    <div className="space-y-4">
      {/* Filters, search and view toggles */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-1 items-center relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={getSearchPlaceholder()}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={sortBy}
            onValueChange={(value) => onSortChange(value as "newest" | "oldest" | "type")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
          
          {renderViewToggle ? (
            renderViewToggle(view, onViewChange)
          ) : (
            <div className="border rounded-md p-1">
              <Button
                variant={view === "table" ? "default" : "ghost"}
                size="icon"
                onClick={() => onViewChange("table")}
                className="h-8 w-8"
              >
                <List className="h-4 w-4" />
                <span className="sr-only">Table view</span>
              </Button>
              <Button
                variant={view === "card" ? "default" : "ghost"}
                size="icon"
                onClick={() => onViewChange("card")}
                className="h-8 w-8"
              >
                <Grid className="h-4 w-4" />
                <span className="sr-only">Card view</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters section */}
      <div className="flex flex-wrap gap-3">
        {/* Type filter dropdown */}
        <DropdownMenu open={typeMenuOpen} onOpenChange={setTypeMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-1">
              <Filter className="h-4 w-4 mr-1" />
              {getFilterLabel()}
              {selectedFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 min-w-4 text-xs">
                  {selectedFilters.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Select {activeView === "activities" ? "activity" : "notification"} types</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {activityTypes.map(type => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={selectedFilters.includes(type)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onSelectFilter(type);
                  } else {
                    onRemoveFilter(type);
                  }
                }}
              >
                {type.replace(/_/g, ' ')}
              </DropdownMenuCheckboxItem>
            ))}
            {selectedFilters.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => {
                  e.preventDefault();
                  onClearFilters();
                }}>
                  Clear all filters
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Date range filter - with dynamic years */}
        <Select
          value={dateRange}
          onValueChange={onDateRangeChange}
        >
          <SelectTrigger className="gap-1 w-[180px]">
            <Calendar className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="this_month">This month</SelectItem>
            <SelectItem value="last_3_months">Last 3 months</SelectItem>
            <SelectItem value="last_6_months">Last 6 months</SelectItem>
            <SelectItem value="this_year">This year</SelectItem>
            {/* Only show year numbers that aren't the current year */}
            {availableYears.map(year => (
              year !== currentYear && (
                <SelectItem key={year} value={year}>Year {year}</SelectItem>
              )
            ))}
          </SelectContent>
        </Select>

        {/* Show alerts only toggle - only show for notifications view */}
        {activeView === "notifications" && (
          <Button 
            variant={alertsOnly ? "default" : "outline"}
            className="gap-1"
            onClick={() => onAlertsOnlyChange(!alertsOnly)}
          >
            <AlertTriangle className={`h-4 w-4 mr-1 ${alertsOnly ? "text-white" : "text-amber-500"}`} />
            {alertsOnly ? "All Notifications" : "Alerts Only"}
          </Button>
        )}
      </div>

      {/* Display selected filters as badges */}
      {selectedFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedFilters.map(filter => (
            <Badge key={filter} variant="secondary" className="flex items-center gap-1">
              {filter.replace(/_/g, ' ')}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => onRemoveFilter(filter)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {filter}</span>
              </Button>
            </Badge>
          ))}
          
          {selectedFilters.length > 1 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-6"
              onClick={onClearFilters}
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
