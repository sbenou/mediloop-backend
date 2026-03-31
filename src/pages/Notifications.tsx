import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationItem from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Filter, SortDesc, Search, Calendar, CheckSquare, X, ChevronDown } from "lucide-react";
import { seedUserNotifications } from "@/utils/seedNotifications";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Notification } from "@/types/domain";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type NotificationFilter = {
  type: string | null;
  readStatus: "all" | "read" | "unread";
  dateRange: string | null;
  searchTerm: string;
};

type SortOption = "newest" | "oldest" | "type";

const PAGE_SIZE = 10;

const Notifications = () => {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    setupRealtimeSubscription,
  } = useNotifications();
  const [isSeeding, setIsSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "alerts">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [filters, setFilters] = useState<NotificationFilter>({
    type: null,
    readStatus: "all",
    dateRange: null,
    searchTerm: "",
  });
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [user, fetchNotifications, setupRealtimeSubscription]);

  const handleSeedNotifications = async () => {
    if (!user) return;
    
    setIsSeeding(true);
    try {
      await seedUserNotifications(user.id);
      toast({
        title: "Notifications seeded",
        description: "Test notifications have been added to your account",
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error seeding notifications:", error);
      toast({
        title: "Error",
        description: "Failed to seed notifications",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  // Get all unique notification types for filter options
  const notificationTypes = Array.from(
    new Set(notifications.map((notif) => notif.type))
  );

  // Apply filters to notifications
  const filterNotifications = (notifications: Notification[]) => {
    let filtered = notifications;
    
    // First filter by tab (all vs alerts)
    if (activeTab === "alerts") {
      filtered = filtered.filter(
        (notif) =>
          notif.type === "payment_failed" ||
          notif.type === "delivery_late" ||
          notif.type === "delivery_failed"
      );
    }
    
    // Then apply user-selected filters
    if (filters.type) {
      filtered = filtered.filter((notif) => notif.type === filters.type);
    }
    
    if (filters.readStatus !== "all") {
      filtered = filtered.filter((notif) => 
        filters.readStatus === "read" ? notif.read : !notif.read
      );
    }
    
    if (filters.dateRange) {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.dateRange) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          filtered = filtered.filter(
            (notif) => new Date(notif.created_at) >= startDate
          );
          break;
        case "yesterday":
          startDate = new Date(now.setDate(now.getDate() - 1));
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          filtered = filtered.filter(
            (notif) => 
              new Date(notif.created_at) >= startDate && 
              new Date(notif.created_at) <= endDate
          );
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          filtered = filtered.filter(
            (notif) => new Date(notif.created_at) >= startDate
          );
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          filtered = filtered.filter(
            (notif) => new Date(notif.created_at) >= startDate
          );
          break;
      }
    }
    
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (notif) =>
          notif.title.toLowerCase().includes(searchLower) ||
          notif.message.toLowerCase().includes(searchLower) ||
          notif.type.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  };

  // Sort filtered notifications
  const sortNotifications = (notifications: Notification[]) => {
    return [...notifications].sort((a, b) => {
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
  };

  // Process notifications with filters and sorting
  const processedNotifications = sortNotifications(filterNotifications(notifications));
  
  // Calculate pagination
  const totalItems = processedNotifications.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  
  // Get current page of notifications
  const currentNotifications = processedNotifications.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy, activeTab]);

  const resetFilters = () => {
    setFilters({
      type: null,
      readStatus: "all",
      dateRange: null,
      searchTerm: "",
    });
    setSortBy("newest");
  };

  // Get human-readable notification type
  const formatNotificationType = (type: string) => {
    return type.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderNotificationTable = () => {
    return (
      <div className="w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentNotifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No notifications found
                </TableCell>
              </TableRow>
            ) : (
              currentNotifications.map((notification) => (
                <TableRow 
                  key={notification.id} 
                  className={notification.read ? "opacity-70" : ""}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <TableCell>
                    {!notification.read ? (
                      <Badge className="bg-primary">New</Badge>
                    ) : (
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatNotificationType(notification.type)}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{notification.title}</TableCell>
                  <TableCell className="max-w-md truncate">{notification.message}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(notification.created_at), "MMM d, yyyy h:mm a")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderNotificationCards = () => {
    if (currentNotifications.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No notifications found</p>
        </div>
      );
    }

    return currentNotifications.map((notification) => (
      <NotificationItem
        key={notification.id}
        notification={notification}
        onMarkRead={markAsRead}
      />
    ));
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          
          {Array.from({ length: totalPages }).map((_, i) => {
            // Show first page, last page, and pages around current page
            const pageNumber = i + 1;
            const isVisible = 
              pageNumber === 1 || 
              pageNumber === totalPages || 
              (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);
            
            if (!isVisible) {
              // Show ellipsis if needed
              if (pageNumber === 2 || pageNumber === totalPages - 1) {
                return (
                  <PaginationItem key={`ellipsis-${pageNumber}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              return null;
            }
            
            return (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  isActive={pageNumber === currentPage}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <div className="flex space-x-2">
          {process.env.NODE_ENV === "development" && (
            <Button onClick={handleSeedNotifications} disabled={isSeeding}>
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding...
                </>
              ) : (
                "Seed Test Notifications"
              )}
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={markAllAsRead} 
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Your Notifications</CardTitle>
          <div className="flex flex-col md:flex-row justify-between gap-4 mt-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search notifications..."
                  className="pl-8 w-full md:w-auto"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    <Filter className="h-4 w-4 mr-1" />
                    Filter
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuGroup>
                    <div className="p-2">
                      <p className="text-sm font-medium mb-2">Notification Type</p>
                      <Select
                        value={filters.type || "all_types"}
                        onValueChange={(value) =>
                          setFilters({ ...filters, type: value === "all_types" ? null : value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_types">All types</SelectItem>
                          {notificationTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {formatNotificationType(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <p className="text-sm font-medium mb-2 mt-4">Read Status</p>
                      <Select
                        value={filters.readStatus}
                        onValueChange={(value) =>
                          setFilters({
                            ...filters,
                            readStatus: value as "all" | "read" | "unread",
                          })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All notifications" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All notifications</SelectItem>
                          <SelectItem value="read">Read only</SelectItem>
                          <SelectItem value="unread">Unread only</SelectItem>
                        </SelectContent>
                      </Select>

                      <p className="text-sm font-medium mb-2 mt-4">Date Range</p>
                      <Select
                        value={filters.dateRange || "all_time"}
                        onValueChange={(value) =>
                          setFilters({ ...filters, dateRange: value === "all_time" ? null : value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_time">All time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="yesterday">Yesterday</SelectItem>
                          <SelectItem value="week">Last 7 days</SelectItem>
                          <SelectItem value="month">Last 30 days</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex justify-between mt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetFilters}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reset
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1">
                    <SortDesc className="h-4 w-4 mr-1" />
                    Sort
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem 
                    onClick={() => setSortBy("newest")}
                    className={sortBy === "newest" ? "bg-muted" : ""}
                  >
                    Newest first
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy("oldest")}
                    className={sortBy === "oldest" ? "bg-muted" : ""}
                  >
                    Oldest first
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy("type")}
                    className={sortBy === "type" ? "bg-muted" : ""}
                  >
                    By type
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    View as {viewMode === "card" ? "Cards" : "Table"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setViewMode("card")}>
                    Cards
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode("table")}>
                    Table
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {(filters.type || filters.readStatus !== "all" || filters.dateRange || filters.searchTerm) && (
              <div className="flex items-center">
                <Badge variant="secondary" className="mr-2">
                  {totalItems} results
                </Badge>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="all" className="w-full" value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "alerts")}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Loading notifications...</span>
              </div>
            ) : (
              <>
                <div className="mt-6">
                  {viewMode === "card" ? renderNotificationCards() : renderNotificationTable()}
                </div>
                {renderPagination()}
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
