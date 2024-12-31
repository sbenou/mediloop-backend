import { useState } from "react";
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
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: connections, refetch } = useQuery({
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

  const handleConnectionResponse = async (doctorId: string, status: 'accepted' | 'rejected') => {
    try {
      setIsUpdating(true);
      const { data, error } = await supabase
        .rpc('handle_connection_request', {
          doctor_id: doctorId,
          status: status
        });

      if (error) throw error;

      toast({
        title: "Connection Updated",
        description: `Connection request ${status}`,
      });

      refetch();
    } catch (error) {
      console.error('Error updating connection:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update connection",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Doctor Connections</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>License Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connections?.map((connection) => (
                <TableRow key={connection.id}>
                  <TableCell>{connection.doctor.full_name}</TableCell>
                  <TableCell>{connection.doctor.license_number}</TableCell>
                  <TableCell>{connection.status}</TableCell>
                  <TableCell>
                    {connection.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConnectionResponse(connection.doctor_id, 'accepted')}
                          disabled={isUpdating}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConnectionResponse(connection.doctor_id, 'rejected')}
                          disabled={isUpdating}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorConnections;