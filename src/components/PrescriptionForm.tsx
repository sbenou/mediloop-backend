import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import MedicationFields from "./MedicationFields";
import ViewPrescription from "./ViewPrescription";
import { Plus } from "lucide-react";

interface PrescriptionFormData {
  patientName: string;
  patientAddress: string;
  doctorName: string;
  doctorAddress: string;
  medications: {
    name: string;
    frequency: "daily" | "weekly";
    dosesPerFrequency: "1" | "2" | "3";
    quantity: string;
  }[];
}

const PrescriptionForm = () => {
  const [submittedData, setSubmittedData] = useState<PrescriptionFormData & { 
    createdAt: string;
    doctorStampUrl?: string;
    doctorSignatureUrl?: string;
  } | null>(null);

  const { data: doctorProfile } = useQuery({
    queryKey: ['doctorProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<PrescriptionFormData>({
    defaultValues: {
      patientName: "",
      patientAddress: "",
      doctorName: doctorProfile?.full_name || "",
      doctorAddress: "",
      medications: [
        {
          name: "",
          frequency: "daily",
          dosesPerFrequency: "1",
          quantity: "",
        },
      ],
    },
  });

  useEffect(() => {
    if (doctorProfile?.full_name) {
      form.setValue('doctorName', doctorProfile.full_name);
    }
  }, [doctorProfile?.full_name, form]);

  const onSubmit = (data: PrescriptionFormData) => {
    const prescriptionWithDate = {
      ...data,
      createdAt: new Date().toLocaleString(),
      doctorStampUrl: doctorProfile?.doctor_stamp_url,
      doctorSignatureUrl: doctorProfile?.doctor_signature_url,
    };
    setSubmittedData(prescriptionWithDate);
    toast({
      title: "Prescription Created",
      description: "The prescription has been successfully created.",
    });
  };

  const addMedication = () => {
    const medications = form.getValues("medications");
    form.setValue("medications", [
      ...medications,
      {
        name: "",
        frequency: "daily",
        dosesPerFrequency: "1",
        quantity: "",
      },
    ]);
  };

  if (submittedData) {
    return <ViewPrescription data={submittedData} />;
  }

  if (!doctorProfile?.doctor_stamp_url || !doctorProfile?.doctor_signature_url) {
    return (
      <Card className="w-full shadow-lg">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Missing Required Information</h2>
            <p className="text-gray-600 mb-4">
              You need to upload both your official stamp and signature before creating prescriptions.
            </p>
            <Button
              onClick={() => window.location.href = '/my-details'}
              variant="outline"
            >
              Go to Profile Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <Card className="w-full shadow-lg">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="text-2xl font-bold text-primary text-center">Electronic Prescription</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Patient Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-primary">Patient Details</h3>
                  <FormField
                    control={form.control}
                    name="patientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-accent/5" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="patientAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient Address</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-accent/5" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Doctor Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-primary">Doctor Details</h3>
                  <FormField
                    control={form.control}
                    name="doctorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doctor/Practice Name</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-accent/5" readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="doctorAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doctor Address</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-accent/5" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Current Date */}
              <div className="text-right text-sm text-gray-600">
                Date: {new Date().toLocaleDateString()}
              </div>

              {/* Medications */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-primary">Medications</h3>
                {form.watch("medications").map((_, index) => (
                  <MedicationFields key={index} form={form} index={index} />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addMedication}
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Medication
                </Button>
              </div>

              <Button type="submit" className="w-full">
                Create Prescription
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionForm;