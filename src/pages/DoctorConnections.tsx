import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Connection = {
  id: string;
  doctor_id: string;
  patient_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  doctor: {
    full_name: string;
    license_number: string;
  };
  patient: {
    full_name: string;
  };
  created_at: string;
};

const DoctorConnections = () => {
  const { toast } = useToast();

  const { data: connections, isLoading, error } = useQuery({
    queryKey: ['connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctor_patient_connections')
        .select(`
          *,
          doctor:profiles!doctor_id(full_name, license_number),
          patient:profiles!patient_id(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Connection[];
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Doctor Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Doctor Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-red-500">
              Failed to load connections. Please try again later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Doctor Connections</CardTitle>
        </CardHeader>
        <CardContent>
          {!connections || connections.length === 0 ? (
            <div className="text-center text-gray-500">
              No doctor connections found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead>License Number</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((connection) => (
                  <TableRow key={connection.id}>
                    <TableCell>{connection.doctor.full_name}</TableCell>
                    <TableCell>{connection.doctor.license_number}</TableCell>
                    <TableCell>{connection.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorConnections;