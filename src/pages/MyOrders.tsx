import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subMonths, startOfYear } from "date-fns";

const MyOrders = () => {
  const [timeFilter, setTimeFilter] = useState("current-month");

  const { data: orders, isLoading } = useQuery({
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

  return (
    <div className="container mx-auto py-8 px-4">
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

      {isLoading ? (
        <div>Loading orders...</div>
      ) : (
        <div className="space-y-4">
          {orders?.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle>
                  Order #{order.id} - {format(new Date(order.created_at), 'PPP')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>Status: {order.status}</p>
                  <p>Total: ${order.total}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;