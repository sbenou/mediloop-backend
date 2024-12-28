import React, { useState } from "react";
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
  const [submittedData, setSubmittedData] = useState<PrescriptionFormData & { createdAt: string } | null>(null);

  const form = useForm<PrescriptionFormData>({
    defaultValues: {
      patientName: "",
      patientAddress: "",
      doctorName: "",
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

  const onSubmit = (data: PrescriptionFormData) => {
    const prescriptionWithDate = {
      ...data,
      createdAt: new Date().toLocaleString(),
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
                          <Input {...field} className="bg-accent/5" />
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