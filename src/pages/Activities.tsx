
import { useState, useEffect } from "react";
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

const ITEMS_PER_PAGE = 10;

const Activities = () => {
  const { 
    activities, 
    isLoading, 
    fetchActivities, 
    markAsRead,
    setupRealtimeSubscription 
  } = useActivities();

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | ActivityType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState<"table" | "card">("table");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "type">("newest");

  // Set up initial data fetching and subscription
  useEffect(() => {
    console.log("Activities page: Setting up data fetching and realtime subscription");
    fetchActivities();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [fetchActivities, setupRealtimeSubscription]);

  // Get unique activity types
  const activityTypes = getActivityTypes(activities);

  // Filter and sort activities
  const filteredActivities = filterAndSortActivities(
    activities,
    activeFilter,
    searchQuery,
    sortBy
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
  const paginatedActivities = paginateActivities(
    filteredActivities,
    currentPage,
    ITEMS_PER_PAGE
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery, sortBy]);

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
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            activityTypes={activityTypes}
            view={view}
            onViewChange={setView}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {/* Activities content */}
          <div>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-pulse text-muted-foreground">Loading activities...</div>
              </div>
            ) : paginatedActivities.length === 0 ? (
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

            {/* Pagination component */}
            <ActivitiesPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default Activities;
