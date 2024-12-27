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
import MedicationFields from "./MedicationFields";
import ViewPrescription from "./ViewPrescription";

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
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Electronic Prescription</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Patient Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Patient Details</h3>
              <FormField
                control={form.control}
                name="patientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Doctor Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Doctor Details</h3>
              <FormField
                control={form.control}
                name="doctorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Doctor/Practice Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Input {...field} />
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
            <h3 className="font-semibold">Medications</h3>
            {form.watch("medications").map((_, index) => (
              <MedicationFields key={index} form={form} index={index} />
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addMedication}
              className="w-full"
            >
              Add Another Medication
            </Button>
          </div>

          <Button type="submit" className="w-full">
            Create Prescription
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default PrescriptionForm;