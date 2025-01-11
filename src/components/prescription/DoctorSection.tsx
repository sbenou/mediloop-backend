import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";

interface DoctorSectionProps {
  form: UseFormReturn<any>;
}

const DoctorSection = ({ form }: DoctorSectionProps) => {
  return (
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
  );
};

export default DoctorSection;