
import { useState, useEffect } from "react";
import { useActivities } from "@/hooks/activity";
import { Activity, ActivityType } from "@/components/activity/ActivityItem";
import UnifiedLayoutTemplate from "@/components/layout/UnifiedLayoutTemplate";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, CheckCircle, Calendar, Clock, Grid, List } from "lucide-react";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 10;

const Activities = () => {
  const { 
    activities, 
    isLoading, 
    fetchActivities, 
    markAsRead, 
    markAllAsRead,
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

  // Get unique activity types from the loaded activities
  const activityTypes = Array.from(new Set(activities.map(activity => activity.type)));

  // Filter and sort activities
  const filteredActivities = activities
    .filter(activity => {
      // Apply type filter
      if (activeFilter !== "all" && activity.type !== activeFilter) return false;
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          activity.title.toLowerCase().includes(query) ||
          activity.description.toLowerCase().includes(query) ||
          activity.type.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      // Apply sorting
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

  // Calculate pagination
  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Format activity timestamp
  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date >= today) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (date >= yesterday) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy h:mm a');
    }
  };

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

          {/* Filters, search and view toggles */}
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex flex-1 items-center relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as "newest" | "oldest" | "type")}
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
                  onClick={() => setView("table")}
                  className="h-8 w-8"
                >
                  <List className="h-4 w-4" />
                  <span className="sr-only">Table view</span>
                </Button>
                <Button
                  variant={view === "card" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setView("card")}
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
            setActiveFilter(v as "all" | ActivityType);
            setCurrentPage(1);
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Type</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="w-[180px]">Time</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[80px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">{activity.type.replace(/_/g, ' ')}</TableCell>
                        <TableCell>
                          <div className="font-medium">{activity.title}</div>
                          <div className="text-sm text-muted-foreground">{activity.description}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{formatActivityTime(activity.timestamp)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {activity.read ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Read
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Unread
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {!activity.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(activity.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span className="sr-only">Mark as read</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedActivities.map((activity) => (
                  <Card key={activity.id} className={`p-4 ${!activity.read ? 'border-l-4 border-l-blue-500' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="text-sm font-medium text-muted-foreground">
                        {activity.type.replace(/_/g, ' ')}
                      </div>
                      {!activity.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => markAsRead(activity.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span className="sr-only">Mark as read</span>
                        </Button>
                      )}
                    </div>
                    <div className="mt-2">
                      <h3 className="font-medium">{activity.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                    </div>
                    <div className="flex items-center mt-4 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      {formatActivityTime(activity.timestamp)}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) handlePageChange(currentPage - 1);
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {/* First page */}
                    {currentPage > 3 && (
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(1);
                          }}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    
                    {/* Ellipsis if needed */}
                    {currentPage > 4 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    
                    {/* Page numbers around current */}
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      let pageNum;
                      if (currentPage <= 2) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 1) {
                        pageNum = totalPages - 2 + i;
                      } else {
                        pageNum = currentPage - 1 + i;
                      }
                      
                      if (pageNum > 0 && pageNum <= totalPages) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(pageNum);
                              }}
                              isActive={pageNum === currentPage}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    
                    {/* Ellipsis if needed */}
                    {currentPage < totalPages - 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    
                    {/* Last page */}
                    {currentPage < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(totalPages);
                          }}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) handlePageChange(currentPage + 1);
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      </div>
    </UnifiedLayoutTemplate>
  );
};

export default Activities;
