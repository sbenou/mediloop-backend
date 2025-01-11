import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import ViewPrescription from "./ViewPrescription";
import PrescriptionHeader from "./prescription/PrescriptionHeader";
import PatientSection from "./prescription/PatientSection";
import DoctorSection from "./prescription/DoctorSection";
import MedicationsSection from "./prescription/MedicationsSection";

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
        <PrescriptionHeader />
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <PatientSection form={form} />
                <DoctorSection form={form} />
              </div>

              <div className="text-right text-sm text-gray-600">
                Date: {new Date().toLocaleDateString()}
              </div>

              <MedicationsSection form={form} onAddMedication={addMedication} />

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