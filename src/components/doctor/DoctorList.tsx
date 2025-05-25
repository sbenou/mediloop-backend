import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Phone, Mail, Clock, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendConnectionRequestNotification } from '@/utils/doctorConnectionNotifications';

interface Doctor {
  id: string;
  full_name: string;
  city: string | null;
  license_number: string;
  phone?: string | null;
  email?: string | null;
  hours?: string | null;
  distance?: number;
  source?: 'database' | 'overpass';
  coordinates?: { lat: number; lon: number } | null;
  address?: string;
}

interface DoctorListProps {
  doctors: Doctor[];
  isLoading: boolean;
  onConnect: (doctorId: string, source: 'database' | 'overpass') => void;
  searchCity?: string;
}

const DoctorList = ({ doctors, isLoading, onConnect, searchCity }: DoctorListProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const connectMutation = useMutation({
    mutationFn: async (doctorId: string) => {
      if (!user?.id) {
        throw new Error('Not authenticated');
      }

      // First check if connection already exists
      const { data: existingConnection } = await supabase
        .from('doctor_patient_connections')
        .select('id, status')
        .eq('doctor_id', doctorId)
        .eq('patient_id', user.id)
        .maybeSingle();

      if (existingConnection) {
        throw new Error(`Connection ${existingConnection.status === 'pending' ? 'request already exists' : 'already established'}`);
      }

      // Use the correct table name: doctor_patient_connections
      const { data, error } = await supabase
        .from('doctor_patient_connections')
        .insert({
          doctor_id: doctorId,
          patient_id: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Connection insert error:', error);
        throw error;
      }

      // Send notification to doctor after successful connection request
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      await sendConnectionRequestNotification(
        doctorId, 
        profileData?.full_name || 'A patient'
      );

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Connection Request Sent",
        description: "Your connection request has been sent to the doctor.",
      });
      queryClient.invalidateQueries({ queryKey: ['doctorConnections'] });
    },
    onError: (error: Error) => {
      console.error('Error connecting to doctor:', error);
      
      let errorMessage = "Failed to connect to doctor. Please try again.";
      if (error.message.includes('already exists')) {
        errorMessage = "You have already sent a connection request to this doctor.";
      } else if (error.message.includes('already established')) {
        errorMessage = "You are already connected to this doctor.";
      }
      
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: errorMessage,
      });
    },
  });

  const handleConnect = (doctorId: string, source: 'database' | 'overpass') => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to connect with doctors.",
        variant: "destructive",
      });
      return;
    }

    if (source === 'overpass') {
      toast({
        title: "Information",
        description: "Connection requests are only available for registered doctors.",
      });
      return;
    }

    connectMutation.mutate(doctorId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-10 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">
            <MapPin className="mx-auto h-12 w-12 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No doctors found</h3>
            <p className="text-sm">
              {searchCity 
                ? `No doctors found in ${searchCity}. Try searching in a different location.`
                : "No doctors found in your area. Try adjusting your search location."
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {doctors.map((doctor) => (
        <Card key={doctor.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {doctor.full_name}
                    </h3>
                    {doctor.license_number && (
                      <p className="text-sm text-gray-600">
                        License: {doctor.license_number}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={doctor.source === 'database' ? 'default' : 'secondary'}>
                      {doctor.source === 'database' ? 'Registered' : 'Listed'}
                    </Badge>
                    {doctor.distance && (
                      <Badge variant="outline">
                        {doctor.distance} km away
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  {doctor.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{doctor.city}</span>
                    </div>
                  )}
                  
                  {doctor.address && doctor.address !== 'Address not available' && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{doctor.address}</span>
                    </div>
                  )}

                  {doctor.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{doctor.phone}</span>
                    </div>
                  )}

                  {doctor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{doctor.email}</span>
                    </div>
                  )}

                  {doctor.hours && doctor.hours !== 'Hours not available' && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{doctor.hours}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-6 flex flex-col gap-2">
                <Button
                  onClick={() => handleConnect(doctor.id, doctor.source || 'database')}
                  disabled={connectMutation.isPending || doctor.source === 'overpass'}
                  className="min-w-[120px]"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {connectMutation.isPending ? "Connecting..." : "Connect"}
                </Button>
                
                {doctor.source === 'overpass' && (
                  <p className="text-xs text-gray-500 text-center">
                    Directory listing only
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DoctorList;
