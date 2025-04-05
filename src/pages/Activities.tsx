
import { useState, useEffect, useMemo } from "react";
import { useActivities } from "@/hooks/activity";
import { ActivityType } from "@/components/activity/ActivityItem";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { 
  filterAndSortActivities, 
  getActivityTypes, 
  paginateActivities 
} from "@/utils/activityUtils";
import { ActivitiesTableView } from "@/components/activities/ActivitiesTableView";
import { ActivitiesCardView } from "@/components/activities/ActivitiesCardView";
import { ActivitiesPagination } from "@/components/activities/ActivitiesPagination";
import { ActivitiesFilters } from "@/components/activities/ActivitiesFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollToTopButton } from "@/components/ui/scroll-to-top";

const ITEMS_PER_PAGE = 10;

const Activities = () => {
  const { 
    activities, 
    isLoading, 
    fetchActivities, 
    markAsRead
  } = useActivities();

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilters, setSelectedTypeFilters] = useState<ActivityType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState<"table" | "card">("table");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "type">("newest");
  const [dateRange, setDateRange] = useState<string>("all");

  // Set up initial data fetching
  useEffect(() => {
    console.log("Activities page: Initial data fetch");
    fetchActivities();
  }, [fetchActivities]);

  // Get unique activity types
  const activityTypes = useMemo(() => {
    return getActivityTypes(activities);
  }, [activities]);

  // Handle filters for activity types
  const handleSelectFilter = (type: ActivityType) => {
    setSelectedTypeFilters(prev => [...prev, type]);
  };

  const handleRemoveFilter = (type: ActivityType) => {
    setSelectedTypeFilters(prev => prev.filter(t => t !== type));
  };

  const handleClearFilters = () => {
    setSelectedTypeFilters([]);
  };

  // Filter and sort activities
  const filteredActivities = useMemo(() => {
    return filterAndSortActivities(
      activities,
      "all",
      searchQuery,
      sortBy,
      dateRange,
      selectedTypeFilters
    );
  }, [activities, selectedTypeFilters, searchQuery, sortBy, dateRange]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
  const paginatedActivities = useMemo(() => {
    return paginateActivities(
      filteredActivities,
      currentPage,
      ITEMS_PER_PAGE
    );
  }, [filteredActivities, currentPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTypeFilters, searchQuery, sortBy, dateRange]);

  // Render loading skeletons
  const renderLoadingState = () => (
    <div className="space-y-6">
      <Skeleton className="h-8 w-1/3" />
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Skeleton key={idx} className="h-20 w-full rounded-md" />
        ))}
      </div>
    </div>
  );

  return (
    <UnifiedLayoutTemplate>
      <div className="container py-6">
        <div className="flex flex-col space-y-8">
          {/* Header with title */}
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold">Activities</h1>
            <p className="text-muted-foreground">
              View and manage your recent activities
            </p>
          </div>

          {/* Filters component */}
          <ActivitiesFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={selectedTypeFilters.length === 1 ? selectedTypeFilters[0] : "all"}
            onFilterChange={() => {}}
            activityTypes={activityTypes}
            view={view}
            onViewChange={setView}
            sortBy={sortBy}
            onSortChange={setSortBy}
            selectedFilters={selectedTypeFilters}
            onSelectFilter={handleSelectFilter}
            onRemoveFilter={handleRemoveFilter}
            onClearFilters={handleClearFilters}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />

          {/* Activities content */}
          <div>
            {isLoading && activities.length === 0 ? (
              renderLoadingState()
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-10 border rounded-lg bg-gray-50">
                <p className="text-muted-foreground">No activities found matching your criteria</p>
              </div>
            ) : view === "table" ? (
              <ActivitiesTableView
                activities={paginatedActivities}
                markAsRead={markAsRead}
              />
            ) : (
              <ActivitiesCardView
                activities={paginatedActivities}
                markAsRead={markAsRead}
              />
            )}

            {/* Only show pagination when we have activities and they're loaded */}
            {!isLoading && filteredActivities.length > 0 && (
              <ActivitiesPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Add scroll to top button */}
      <ScrollToTopButton />
    </UnifiedLayoutTemplate>
  );
};

export default Activities;
