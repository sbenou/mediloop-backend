
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
import NotificationItem from "@/components/notifications/NotificationItem";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollToTopButton } from "@/components/ui/scroll-to-top";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

const ITEMS_PER_PAGE = 10;
const ALERT_TYPES = ["payment_failed", "delivery_late", "delivery_failed"];

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
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState<"table" | "card">("table");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "type">("newest");
  const [dateRange, setDateRange] = useState<string>("all");
  const [notificationsView, setNotificationsView] = useState<"table" | "card">("table");

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

  // Get unique notification types
  const notificationTypes = useMemo(() => {
    return Array.from(new Set(notifications.map(n => n.type))) as ActivityType[];
  }, [notifications]);

  // Handle filters for activity types
  const handleSelectFilter = (type: ActivityType) => {
    setSelectedTypeFilters(prev => [...prev, type]);
  };

  const handleRemoveFilter = (type: ActivityType) => {
    setSelectedTypeFilters(prev => prev.filter(t => t !== type));
  };

  const handleClearFilters = () => {
    setSelectedTypeFilters([]);
    setAlertsOnly(false);
  };

  // Handle alerts only toggle
  const handleAlertsOnlyChange = (value: boolean) => {
    setAlertsOnly(value);
    
    if (value) {
      // When enabling alerts only, clear any existing type filters that aren't alerts
      setSelectedTypeFilters(prev => 
        prev.filter(type => ALERT_TYPES.includes(type))
      );
    }
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

  // Filter notifications (based on search, type filters, and alerts filter)
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (notif) => 
          notif.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
          notif.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply type filters
    if (selectedTypeFilters.length > 0) {
      filtered = filtered.filter((notif) => 
        selectedTypeFilters.includes(notif.type as ActivityType)
      );
    }
    
    // Apply alerts filter
    if (alertsOnly) {
      filtered = filtered.filter((notif) => 
        ALERT_TYPES.includes(notif.type)
      );
    }
    
    // Apply sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "type":
          return a.type.localeCompare(b.type);
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    
    return filtered;
  }, [notifications, searchQuery, selectedTypeFilters, alertsOnly, sortBy]);

  // Calculate pagination for active content
  const totalItems = activeView === "activities" 
    ? filteredActivities.length 
    : filteredNotifications.length;
    
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  
  // Paginate the appropriate content based on active view
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
  }, [selectedTypeFilters, searchQuery, sortBy, dateRange, activeView, alertsOnly]);

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
          <p className="text-muted-foreground">
            {alertsOnly ? "No alerts found" : "No notifications found"}
          </p>
        </div>
      );
    }

    // Rendering notifications based on view mode (table or card)
    if (notificationsView === "card") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
          {(paginatedContent as Notification[]).map((notification) => (
            <div key={notification.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <NotificationItem 
                notification={notification}
                onMarkRead={markNotificationAsRead}
              />
            </div>
          ))}
        </div>
      );
    }

    // Default table view for notifications
    return (
      <ScrollArea className="h-[calc(100vh-350px)]">
        <div className="space-y-2 p-1">
          {(paginatedContent as Notification[]).map((notification) => (
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
        activities={paginatedContent as any[]}
        markAsRead={markActivityAsRead}
      />
    ) : (
      <ActivitiesCardView
        activities={paginatedContent as any[]}
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
                {activeView === "activities" ? "Activities" : alertsOnly ? "Alerts" : "Notifications"}
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
                : alertsOnly 
                  ? "View and manage your important alerts" 
                  : "View and manage your notifications and alerts"}
            </p>
          </div>

          {/* Filters component */}
          <ActivitiesFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={selectedTypeFilters.length === 1 ? selectedTypeFilters[0] : "all"}
            onFilterChange={() => {}}
            activityTypes={activeView === "activities" ? activityTypes : notificationTypes}
            view={activeView === "activities" ? view : notificationsView}
            onViewChange={(newView) => {
              if (activeView === "activities") {
                setView(newView);
              } else {
                setNotificationsView(newView);
              }
            }}
            sortBy={sortBy}
            onSortChange={setSortBy}
            selectedFilters={selectedTypeFilters}
            onSelectFilter={handleSelectFilter}
            onRemoveFilter={handleRemoveFilter}
            onClearFilters={handleClearFilters}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            activeView={activeView}
            alertsOnly={alertsOnly}
            onAlertsOnlyChange={handleAlertsOnlyChange}
            renderViewToggle={(currentView, onChange) => (
              <div className="border rounded-md p-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className={`h-8 w-8 inline-flex items-center justify-center rounded-sm ${
                          currentView === "table" ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => onChange("table")}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list">
                          <line x1="8" y1="6" x2="21" y2="6"></line>
                          <line x1="8" y1="12" x2="21" y2="12"></line>
                          <line x1="8" y1="18" x2="21" y2="18"></line>
                          <line x1="3" y1="6" x2="3.01" y2="6"></line>
                          <line x1="3" y1="12" x2="3.01" y2="12"></line>
                          <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>List view</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className={`h-8 w-8 inline-flex items-center justify-center rounded-sm ${
                          currentView === "card" ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => onChange("card")}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-grid">
                          <rect x="3" y="3" width="7" height="7"></rect>
                          <rect x="14" y="3" width="7" height="7"></rect>
                          <rect x="14" y="14" width="7" height="7"></rect>
                          <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Card view</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          />

          {/* Content based on active view */}
          <div>
            {isLoading && (activeView === "activities" ? filteredActivities.length === 0 : filteredNotifications.length === 0) ? (
              renderLoadingState()
            ) : activeView === "activities" ? (
              renderActivities()
            ) : (
              renderNotifications()
            )}

            {/* Only show pagination when we have content and it's loaded */}
            {!isLoading && totalItems > 0 && (
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
