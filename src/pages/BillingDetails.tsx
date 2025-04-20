
import React, { useState, useMemo } from "react";
import PatientLayout from "@/components/layout/PatientLayout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/auth/useAuth";
import BillingHistoryFilters from "@/components/billing/BillingHistoryFilters";
import { Badge } from "@/components/ui/badge";

// TEMP: Mock payment data
const paymentLogs = [
  {
    id: "1",
    product: "Monthly Subscription",
    date: "2024-04-15",
    paidBy: "john.doe@example.com",
    status: "success",
    attempts: 1
  },
  {
    id: "2",
    product: "Product A",
    date: "2024-03-10",
    paidBy: "john.doe@example.com",
    status: "failed",
    attempts: 2
  },
  {
    id: "3",
    product: "Monthly Subscription",
    date: "2023-11-20",
    paidBy: "john.doe@example.com",
    status: "success",
    attempts: 1
  },
  {
    id: "4",
    product: "Product B",
    date: "2023-08-05",
    paidBy: "john.doe@example.com",
    status: "failed",
    attempts: 2
  }
];

const statusOptions = [
  { value: "success", label: "Successful" },
  { value: "failed", label: "Failed" },
];

function filterPayments(payments, { search, status, dateRange, sort }) {
  let filtered = payments;

  // Status filter
  if (status && status !== "all") {
    filtered = filtered.filter(p => p.status === status);
  }

  // Search filter
  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter(
      p =>
        p.product.toLowerCase().includes(query) ||
        p.paidBy.toLowerCase().includes(query)
    );
  }

  // Date range filter (very basic, for demo - in real apps adapt logic)
  if (dateRange && dateRange !== "all") {
    const now = new Date();
    let startDate;
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
        if (/^\d{4}$/.test(dateRange)) {
          startDate = new Date(Number(dateRange), 0, 1);
          const endDate = new Date(Number(dateRange), 11, 31, 23, 59, 59, 999);
          filtered = filtered.filter(p => {
            const d = new Date(p.date);
            return d >= startDate && d <= endDate;
          });
          return filtered;
        }
        break;
    }
    if (startDate) {
      filtered = filtered.filter(p => new Date(p.date) >= startDate);
    }
  }

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sort === "oldest") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return filtered;
}

export default function BillingDetails() {
  const { profile } = useAuth();
  // Handle billing address safely
  const billingAddress = profile?.address || (profile?.city ? `City: ${profile.city}` : "No address provided");

  // Filters & view states
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [view, setView] = useState<"table" | "card">("table");

  const filteredPayments = useMemo(
    () => filterPayments(paymentLogs, { search, status, dateRange, sort: sortBy }),
    [search, status, dateRange, sortBy]
  );

  return (
    <PatientLayout hideHeader>
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="text-3xl font-bold my-6">Billing</h2>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Billing Details</TabsTrigger>
            <TabsTrigger value="history">Payment History</TabsTrigger>
          </TabsList>

          {/* Billing Address Tab */}
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Billing Address</CardTitle>
                <CardDescription>This is the billing address associated with your account.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="px-2 py-2 text-muted-foreground text-lg">
                  {billingAddress}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="history" className="space-y-4">
            {/* Filters */}
            <BillingHistoryFilters
              searchQuery={search}
              onSearchChange={setSearch}
              statusFilter={status as any}
              onStatusFilterChange={setStatus}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              sortBy={sortBy}
              onSortChange={setSortBy}
              view={view}
              onViewChange={setView}
            />

            <div>
              {filteredPayments.length === 0 ? (
                <div className="text-center py-10 border rounded-lg bg-gray-50">
                  <p className="text-muted-foreground">
                    No payment history available.
                  </p>
                </div>
              ) : view === "table" ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>Review all past payments on your account.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Purchased Date</TableHead>
                          <TableHead>Paid By</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Attempts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPayments.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>{log.product}</TableCell>
                            <TableCell>{log.date}</TableCell>
                            <TableCell>{log.paidBy}</TableCell>
                            <TableCell>
                              <Badge variant={log.status === "success" ? "default" : "destructive"}>
                                {log.status === "success" ? "Successful" : "Failed"}
                              </Badge>
                            </TableCell>
                            <TableCell>{log.attempts}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                // Card view for payment logs
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredPayments.map(log => (
                    <Card key={log.id}>
                      <CardHeader>
                        <CardTitle className="text-base font-semibold">{log.product}</CardTitle>
                        <CardDescription>
                          <span className="text-sm text-muted-foreground">{log.date}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2">
                        <div><span className="font-medium">Paid By: </span>{log.paidBy}</div>
                        <div>
                          <span className="font-medium">Status: </span>
                          <Badge variant={log.status === "success" ? "default" : "destructive"}>
                            {log.status === "success" ? "Successful" : "Failed"}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Attempts: </span>{log.attempts}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PatientLayout>
  );
}

