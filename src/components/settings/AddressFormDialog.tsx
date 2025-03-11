
import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { AddressType } from "./types";
import AddressFields from "@/components/address/AddressFields";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";

interface AddressFormDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingAddresses: any[];
}

const formSchema = z.object({
  street: z.string().min(3, "Street address is required"),
  city: z.string().min(2, "City is required"),
  postal_code: z.string().min(2, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
  type: z.enum(["main", "secondary", "work"]),
  is_default: z.boolean().default(false)
});

type FormData = z.infer<typeof formSchema>;

const AddressFormDialog = ({ userId, open, onOpenChange, existingAddresses }: AddressFormDialogProps) => {
  const queryClient = useQueryClient();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      street: "",
      city: "",
      postal_code: "",
      country: "",
      type: "secondary" as AddressType,
      is_default: false
    }
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        street: "",
        city: "",
        postal_code: "",
        country: "",
        type: "secondary",
        is_default: false
      });
    }
  }, [open, form]);

  const addAddressMutation = useMutation({
    mutationFn: async (address: FormData) => {
      const addressToInsert = {
        ...address,
        user_id: userId,
        is_default: !existingAddresses?.length || address.is_default
      };

      const { error } = await supabase
        .from('addresses')
        .insert([addressToInsert]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast({
        title: "Address Added",
        description: "Your new address has been added successfully.",
      });
      onOpenChange(false);
    },
  });

  const handleSubmit = (data: FormData) => {
    addAddressMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Address</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <AddressFields form={form} />

            <div className="space-y-2">
              <Label htmlFor="type">Address Type</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(value: AddressType) => form.setValue("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select address type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addAddressMutation.isPending}>
                {addAddressMutation.isPending ? "Adding..." : "Add Address"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddressFormDialog;
