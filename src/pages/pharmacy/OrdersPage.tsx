
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

interface Order {
  id: string;
  user_id: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

const OrdersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'all';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would be filtered to show only orders for this pharmacy
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Now fetch user profiles separately for each order
        const ordersWithUserInfo = await Promise.all(
          (data || []).map(async (order) => {
            try {
              const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('email, full_name')
                .eq('id', order.user_id)
                .single();

              if (userError || !userData) {
                return {
                  ...order,
                  user_email: 'Unknown',
                  user_name: 'Unknown User',
                };
              }

              return {
                ...order,
                user_email: userData.email,
                user_name: userData.full_name,
              };
            } catch (error) {
              console.error('Error fetching user data for order:', error);
              return {
                ...order,
                user_email: 'Unknown',
                user_name: 'Unknown User',
              };
            }
          })
        );
        
        setOrders(ordersWithUserInfo);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleTabChange = (value: string) => {
    console.log("OrdersPage: Tab changed to", value);
    setSearchParams({ tab: value });
  };

  // Determine content based on tab
  const renderTabContent = () => {
    if (tab === 'payments') {
      return (
        <div className="bg-white shadow rounded-lg">
          <h2 className="text-xl font-semibold p-4 border-b">Payment Records</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No payment records found.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      );
    }

    return (
      <div className="bg-white shadow rounded-lg">
        <h2 className="text-xl font-semibold p-4 border-b">All Orders</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                  <TableCell>{order.user_name || 'Unknown'}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right">€{order.total.toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <PharmacistLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {tab === 'payments' ? 'Payment Records' : 'Orders Management'}
          </h1>
          <p className="text-muted-foreground">
            {tab === 'payments' 
              ? 'View and manage all pharmacy payment records.' 
              : 'View and manage all pharmacy orders.'}
          </p>
        </div>
        
        <Tabs defaultValue={tab} value={tab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            {renderTabContent()}
          </TabsContent>
          
          <TabsContent value="payments" className="mt-4">
            {renderTabContent()}
          </TabsContent>
        </Tabs>
      </div>
    </PharmacistLayout>
  );
};

const OrderStatusBadge = ({ status }: { status: string }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  
  switch (status) {
    case 'pending':
      variant = "outline";
      break;
    case 'processing':
      variant = "secondary";
      break;
    case 'shipped':
      variant = "default";
      break;
    case 'delivered':
      variant = "default";
      break;
    case 'cancelled':
      variant = "destructive";
      break;
    default:
      variant = "outline";
  }
  
  return (
    <Badge variant={variant}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default OrdersPage;
