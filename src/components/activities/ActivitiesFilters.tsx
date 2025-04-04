
import React from "react";
import { ActivityType } from "@/components/activity/ActivityItem";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Grid, List } from "lucide-react";

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
}) => {
  return (
    <>
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

      {/* Type filtering tabs */}
      <Tabs defaultValue="all" value={activeFilter} onValueChange={(v) => {
        onFilterChange(v as "all" | ActivityType);
      }}>
        <TabsList className="mb-4 flex flex-wrap h-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          {activityTypes.map(type => (
            <TabsTrigger key={type} value={type}>
              {type.replace(/_/g, ' ')}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </>
  );
};
