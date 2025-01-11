import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";

interface PatientSectionProps {
  form: UseFormReturn<any>;
}

const PatientSection = ({ form }: PatientSectionProps) => {
  return (
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
  );
};

export default PatientSection;