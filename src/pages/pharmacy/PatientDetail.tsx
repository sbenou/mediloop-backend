import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { UserProfile } from '@/types/user';
import PharmacistLayout from '@/components/layout/PharmacistLayout';

interface PatientData {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  // Include other relevant fields from the profiles table
  pharmacy_name: string | null;
  pharmacy_logo_url: string | null;
}

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [patient, setPatient] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    if (!id) {
      setError("Patient ID is missing");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching patient data:", error);
        setError("Failed to fetch patient data");
        setIsLoading(false);
        return;
      }

      if (!data) {
        setError("Patient not found");
        setIsLoading(false);
        return;
      }

      // Ensure the fetched data matches the PatientData interface
      const patientInfo: PatientData = {
        id: data.id,
        full_name: data.full_name,
        email: data.email,
        avatar_url: data.avatar_url,
        pharmacy_name: data.pharmacy_name || null,
        pharmacy_logo_url: data.pharmacy_logo_url || null,
        // Map other relevant fields from the profiles table
      };

      setPatientData(patientInfo);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching patient data:", error);
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (patientData) {
      // Add the pharmacy fields to ensure compatibility with UserProfile
      const completeProfile: UserProfile = {
        ...patientData,
        pharmacy_name: patientData.pharmacy_name || null,
        pharmacy_logo_url: patientData.pharmacy_logo_url || null
      };
      
      setPatient(completeProfile);
    }
  }, [patientData]);

  if (isLoading) {
    return (
      <PharmacistLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-muted-foreground">Loading patient information...</p>
          </div>
        </div>
      </PharmacistLayout>
    );
  }

  if (error) {
    return (
      <PharmacistLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <h2 className="text-xl font-semibold">Patient Data Unavailable</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchPatientData} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </PharmacistLayout>
    );
  }

  if (!patient) {
    return (
      <PharmacistLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <h2 className="text-xl font-semibold">Patient Not Found</h2>
            <p className="text-muted-foreground">
              The requested patient could not be found.
            </p>
          </div>
        </div>
      </PharmacistLayout>
    );
  }

  return (
    <PharmacistLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Details</h1>
          <p className="text-muted-foreground">
            View detailed information about the patient.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
            <CardDescription>Details about the selected patient</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={patient.avatar_url || undefined} alt={patient.full_name || "Patient"} />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{patient.full_name || "Unknown Patient"}</h2>
              <p className="text-sm text-muted-foreground">{patient.email || "No email"}</p>
              {/* Display other relevant patient information here */}
            </div>
          </CardContent>
        </Card>
      </div>
    </PharmacistLayout>
  );
};

export default PatientDetail;
