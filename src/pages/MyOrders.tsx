
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, subMonths, startOfYear } from "date-fns";
import { Package2, CreditCard } from "lucide-react";

const MyOrders = () => {
  const [timeFilter, setTimeFilter] = useState("current-month");
  const [activeTab, setActiveTab] = useState("orders");

  const { data: orders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['orders', timeFilter],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return [];

      let startDate;
      switch (timeFilter) {
        case 'current-month':
          startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
          break;
        case 'last-3-months':
          startDate = subMonths(new Date(), 3);
          break;
        case 'this-year':
          startDate = startOfYear(new Date());
          break;
        default:
          startDate = new Date(timeFilter);
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Mock payment data for demonstration
  // In a real app, this would be fetched from a payments table
  const { data: payments, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['payments', timeFilter],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return [];

      // This is a placeholder - in a real app, you would fetch from a real payments table
      // For now we'll generate mock data based on the orders
      if (!orders) return [];

      // Create mock payment data from orders
      return orders.map(order => ({
        id: `pay_${order.id.substring(0, 8)}`,
        order_id: order.id,
        amount: order.total,
        status: Math.random() > 0.2 ? 'successful' : 'failed',
        reason: Math.random() > 0.2 ? null : 'Card declined',
        payment_method: Math.random() > 0.5 ? 'Credit Card' : 'PayPal',
        created_at: order.created_at
      }));
    },
    enabled: !!orders,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'successful':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Orders</h1>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
              <SelectItem value="2023">Year 2023</SelectItem>
              <SelectItem value="2022">Year 2022</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            {isOrdersLoading ? (
              <div className="text-center py-8">Loading orders...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableCaption>A list of your recent orders.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders && orders.length > 0 ? (
                      orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id.substring(0, 8)}</TableCell>
                          <TableCell>{format(new Date(order.created_at), 'PPP')}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">${order.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Package2 className="h-8 w-8" />
                            <p>No orders found for this period</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="payments">
            {isPaymentsLoading ? (
              <div className="text-center py-8">Loading payment history...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableCaption>A list of your payment history.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments && payments.length > 0 ? (
                      payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.id}</TableCell>
                          <TableCell>{format(new Date(payment.created_at), 'PPP')}</TableCell>
                          <TableCell>
                            <a href={`#order-details-${payment.order_id}`} className="text-primary hover:underline">
                              #{payment.order_id.substring(0, 8)}
                            </a>
                          </TableCell>
                          <TableCell>{payment.payment_method}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {payment.reason || "-"}
                          </TableCell>
                          <TableCell className="text-right">${payment.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <CreditCard className="h-8 w-8" />
                            <p>No payment history found for this period</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default MyOrders;
