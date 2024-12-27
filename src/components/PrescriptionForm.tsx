import React from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

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
    console.log("Prescription Data:", data);
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
              <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                <FormField
                  control={form.control}
                  name={`medications.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medication Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`medications.${index}.frequency`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`medications.${index}.dosesPerFrequency`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doses per {form.watch(`medications.${index}.frequency`)}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select doses" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Once</SelectItem>
                          <SelectItem value="2">Twice</SelectItem>
                          <SelectItem value="3">Three times</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`medications.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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