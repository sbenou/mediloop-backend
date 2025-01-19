import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { UserPlus, UserMinus } from "lucide-react";

interface Doctor {
  id: string;
  full_name: string;
  license_number: string;
  city: string;
  doctor_id: string;
}

const DoctorManagement = () => {
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
  });

  const { data: connections } = useQuery({
    queryKey: ['doctorConnections'],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      
      const { data, error } = await supabase
        .from('doctor_patient_connections')
        .select(`
          *,
          doctor:profiles!doctor_id(id, full_name, license_number, city)
        `)
        .eq('patient_id', session.user.id)
        .eq('status', 'accepted');
      
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const removeDoctorMutation = useMutation({
    mutationFn: async (doctorId: string) => {
      if (!session?.user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('doctor_patient_connections')
        .delete()
        .eq('doctor_id', doctorId)
        .eq('patient_id', session.user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctorConnections'] });
      toast({
        title: "Doctor Removed",
        description: "The doctor has been removed from your connections.",
      });
    },
  });

  if (!session?.user?.id) {
    return <div>Please log in to manage your doctor connections.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your GP</CardTitle>
      </CardHeader>
      <CardContent>
        {connections?.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">No GP connected yet.</p>
            <Button 
              className="mt-2"
              onClick={() => window.location.href = '/find-doctor'}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Find a GP
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {connections?.map((connection) => (
              <div
                key={connection.doctor.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{connection.doctor.full_name}</div>
                  <div className="text-sm text-gray-600">
                    License: {connection.doctor.license_number}
                  </div>
                  <div className="text-sm text-gray-600">
                    City: {connection.doctor.city}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeDoctorMutation.mutate(connection.doctor.id)}
                  disabled={removeDoctorMutation.isPending}
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DoctorManagement;