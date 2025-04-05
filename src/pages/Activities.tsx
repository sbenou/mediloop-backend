
import { useState, useEffect, useMemo } from "react";
import { useActivities } from "@/hooks/activity";
import { useNotifications } from "@/hooks/useNotifications";
import { ActivityType } from "@/components/activity/ActivityItem";
import { Notification } from "@/types/supabase";
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
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollToTopButton } from "@/components/ui/scroll-to-top";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

const ITEMS_PER_PAGE = 10;

interface ActivitiesProps {
  initialView?: "activities" | "notifications";
}

const Activities = ({ initialView = "activities" }: ActivitiesProps) => {
  // Get search params to determine view from URL
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get("view");
  
  // Activities data
  const { 
    activities, 
    isLoading: isActivitiesLoading, 
    fetchActivities, 
    markAsRead: markActivityAsRead
  } = useActivities();

  // Notifications data
  const {
    notifications,
    isLoading: isNotificationsLoading,
    fetchNotifications,
    markAsRead: markNotificationAsRead,
    markAllAsRead
  } = useNotifications();
  
  // UI State
  const [activeView, setActiveView] = useState<"activities" | "notifications">(
    viewParam === "notifications" ? "notifications" : 
    viewParam === "activities" ? "activities" : 
    initialView
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilters, setSelectedTypeFilters] = useState<ActivityType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState<"table" | "card">("table");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "type">("newest");
  const [dateRange, setDateRange] = useState<string>("all");

  // Update URL when changing views without causing a navigation
  const handleViewChange = (view: "activities" | "notifications") => {
    setActiveView(view);
    setSearchParams({ view });
  };

  // Set up initial data fetching for both activities and notifications
  useEffect(() => {
    console.log("Activities page: Initial data fetch");
    fetchActivities();
    fetchNotifications();
  }, [fetchActivities, fetchNotifications]);

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

  // Filter notifications (basic filtering for now)
  const filteredNotifications = useMemo(() => {
    if (searchQuery) {
      return notifications.filter(
        (notif) => 
          notif.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          notif.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return notifications;
  }, [notifications, searchQuery]);

  // Calculate pagination for active content
  const activeContent = activeView === "activities" ? filteredActivities : filteredNotifications;
  const totalPages = Math.ceil(activeContent.length / ITEMS_PER_PAGE);
  
  const paginatedContent = useMemo(() => {
    if (activeView === "activities") {
      return paginateActivities(filteredActivities, currentPage, ITEMS_PER_PAGE);
    } else {
      // Simple pagination for notifications
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredNotifications.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }
  }, [activeView, filteredActivities, filteredNotifications, currentPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Reset to first page when filters change or view changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTypeFilters, searchQuery, sortBy, dateRange, activeView]);

  // Determine if we're in loading state
  const isLoading = activeView === "activities" ? isActivitiesLoading : isNotificationsLoading;

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

  // Render notifications section
  const renderNotifications = () => {
    if (filteredNotifications.length === 0) {
      return (
        <div className="text-center py-10 border rounded-lg bg-gray-50">
          <p className="text-muted-foreground">No notifications found</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[calc(100vh-350px)]">
        <div className="space-y-2 p-1">
          {paginatedContent.map((notification: Notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={markNotificationAsRead}
            />
          ))}
        </div>
      </ScrollArea>
    );
  };

  // Render activities section
  const renderActivities = () => {
    if (filteredActivities.length === 0) {
      return (
        <div className="text-center py-10 border rounded-lg bg-gray-50">
          <p className="text-muted-foreground">No activities found matching your criteria</p>
        </div>
      );
    }
    
    return view === "table" ? (
      <ActivitiesTableView
        activities={paginatedContent}
        markAsRead={markActivityAsRead}
      />
    ) : (
      <ActivitiesCardView
        activities={paginatedContent}
        markAsRead={markActivityAsRead}
      />
    );
  };

  return (
    <UnifiedLayoutTemplate>
      <div className="container py-6">
        <div className="flex flex-col space-y-8">
          {/* Header with title and view tabs */}
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-3xl font-bold">
                {activeView === "activities" ? "Activities" : "Notifications"}
              </h1>
              
              <Tabs value={activeView} onValueChange={(value) => handleViewChange(value as "activities" | "notifications")}>
                <TabsList>
                  <TabsTrigger value="activities">Activities</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <p className="text-muted-foreground">
              {activeView === "activities" 
                ? "View and manage your recent activities" 
                : "View and manage your notifications and alerts"}
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

          {/* Content based on active view */}
          <div>
            {isLoading && activeContent.length === 0 ? (
              renderLoadingState()
            ) : activeView === "activities" ? (
              renderActivities()
            ) : (
              renderNotifications()
            )}

            {/* Only show pagination when we have content and it's loaded */}
            {!isLoading && activeContent.length > 0 && (
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
