
import React from "react";
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
import { Grid, List, Search, X } from "lucide-react";

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
}) => {
  return (
    <div className="space-y-4">
      {/* Filters, search and view toggles */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-1 items-center relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
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
        </div>
      </div>

      {/* Filter type selector */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-medium">Filter by type:</h3>
          <Select 
            value={activeFilter === "all" ? "all" : activeFilter} 
            onValueChange={(value) => {
              if (value === "all") {
                onFilterChange("all");
              } else {
                onFilterChange(value as ActivityType);
              }
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {activityTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
    </div>
  );
};
