
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
    markAsRead,
    setupRealtimeSubscription 
  } = useActivities();

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilters, setSelectedTypeFilters] = useState<ActivityType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState<"table" | "card">("table");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "type">("newest");
  const [dateRange, setDateRange] = useState<string>("all");

  // Set up initial data fetching and subscription
  useEffect(() => {
    console.log("Activities page: Setting up data fetching and realtime subscription");
    fetchActivities();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [fetchActivities, setupRealtimeSubscription]);

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

  // Filter by date range
  const filterByDateRange = (activities: any[]) => {
    if (dateRange === "all") return activities;
    
    const now = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case "this_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "last_3_months":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "last_6_months":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "this_year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        // Check if it's a year filter (e.g., "2023")
        if (/^\d{4}$/.test(dateRange)) {
          const year = parseInt(dateRange, 10);
          startDate = new Date(year, 0, 1);
          const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
          return activities.filter(activity => {
            const activityDate = new Date(activity.timestamp);
            return activityDate >= startDate && activityDate <= endDate;
          });
        }
        return activities;
    }
    
    return activities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      return activityDate >= startDate;
    });
  };

  // Filter and sort activities
  const filteredActivities = useMemo(() => {
    // First filter by type filters
    let filtered = activities;
    
    if (selectedTypeFilters.length > 0) {
      filtered = filtered.filter(activity => 
        selectedTypeFilters.includes(activity.type as ActivityType)
      );
    }
    
    // Then apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query) ||
        activity.type.toLowerCase().includes(query)
      );
    }
    
    // Apply date range filter
    filtered = filterByDateRange(filtered);
    
    // Finally sort the results
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case "oldest":
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case "type":
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });
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

            {/* Only show pagination when we have activities and not loading */}
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
