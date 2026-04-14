import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ViewPrescription from "./ViewPrescription";
import PrescriptionHeader from "./prescription/PrescriptionHeader";
import PatientSection from "./prescription/PatientSection";
import DoctorSection from "./prescription/DoctorSection";
import MedicationsSection from "./prescription/MedicationsSection";
import { buildAuthHeaders, MEDILOOP_API_BASE, getAccessToken } from "@/lib/activeContext";
import { createPrescriptionApi } from "@/services/clinicalApi";
import { useDoctorPatients } from "@/hooks/teleconsultation/useDoctorPatients";

interface PrescriptionFormData {
  patient_id: string;
  patientName: string;
  patientAddress: string;
  doctorName: string;
  doctorAddress: string;
  patientPhone?: string;
  medications: {
    name: string;
    frequency: "daily" | "weekly";
    dosesPerFrequency: "1" | "2" | "3";
    quantity: string;
  }[];
}

const PrescriptionForm = () => {
  const [submittedData, setSubmittedData] = useState<
    (PrescriptionFormData & {
      createdAt: string;
      doctorStampUrl?: string;
      doctorSignatureUrl?: string;
      prescriptionIds?: string[];
    }) | null
  >(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: profilePayload, isLoading: profileLoading } = useQuery({
    queryKey: ["prescriptionFormProfile"],
    queryFn: async () => {
      if (!getAccessToken()) throw new Error("Not signed in");
      const res = await fetch(`${MEDILOOP_API_BASE}/api/auth/profile`, {
        method: "GET",
        headers: await buildAuthHeaders({ "Content-Type": "application/json" }),
      });
      if (!res.ok) throw new Error("Failed to load profile");
      const j = (await res.json()) as { profile?: Record<string, unknown> };
      if (!j.profile) throw new Error("No profile");
      return j.profile;
    },
  });

  const doctorProfile = profilePayload
    ? {
        id: String(profilePayload.id ?? ""),
        full_name: (profilePayload.full_name as string) ?? "",
        doctor_stamp_url: profilePayload.doctor_stamp_url as string | null,
        doctor_signature_url: profilePayload.doctor_signature_url as string | null,
      }
    : null;

  const { patients, loading: patientsLoading } = useDoctorPatients(
    doctorProfile?.id,
  );

  const form = useForm<PrescriptionFormData>({
    defaultValues: {
      patient_id: "",
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
      form.setValue("doctorName", doctorProfile.full_name);
    }
  }, [doctorProfile?.full_name, form]);

  const onSubmit = async (data: PrescriptionFormData) => {
    if (!data.patient_id?.trim()) {
      toast({
        variant: "destructive",
        title: "Select a patient",
        description: "Choose a connected patient before creating prescriptions.",
      });
      return;
    }

    const meds = data.medications.filter((m) => m.name.trim().length > 0);
    if (meds.length === 0) {
      toast({
        variant: "destructive",
        title: "Add medication",
        description: "Enter at least one medication name.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const ids: string[] = [];
      for (const m of meds) {
        const created = await createPrescriptionApi({
          patient_id: data.patient_id.trim(),
          medication_name: m.name.trim(),
          dosage: `${m.dosesPerFrequency} dose(s)`,
          frequency: m.frequency,
          duration: m.quantity.trim() || "as directed",
          notes: null,
          status: "active",
        });
        const id = created.id;
        if (typeof id === "string") ids.push(id);
      }

      setSubmittedData({
        ...data,
        medications: meds,
        createdAt: new Date().toLocaleString(),
        doctorStampUrl: doctorProfile?.doctor_stamp_url ?? undefined,
        doctorSignatureUrl: doctorProfile?.doctor_signature_url ?? undefined,
        prescriptionIds: ids,
      });
      toast({
        title: "Prescription saved",
        description: `${ids.length} line(s) recorded.`,
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Could not save",
        description: e instanceof Error ? e.message : "Try again",
      });
    } finally {
      setSubmitting(false);
    }
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

  if (profileLoading || !doctorProfile) {
    return (
      <Card className="w-full shadow-lg max-w-4xl mx-auto">
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center py-8">Loading profile…</p>
        </CardContent>
      </Card>
    );
  }

  if (!doctorProfile.doctor_stamp_url || !doctorProfile.doctor_signature_url) {
    return (
      <Card className="w-full shadow-lg">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-red-600 mb-4">
              Missing required information
            </h2>
            <p className="text-gray-600 mb-4">
              Upload both your official stamp and signature before creating prescriptions.
            </p>
            <Button
              onClick={() => (window.location.href = "/my-details")}
              variant="outline"
            >
              Go to profile settings
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
              <div className="space-y-2">
                <Label>Patient</Label>
                <Select
                  disabled={patientsLoading || patients.length === 0}
                  value={form.watch("patient_id") || undefined}
                  onValueChange={(patientId) => {
                    form.setValue("patient_id", patientId);
                    const p = patients.find((x) => x.id === patientId);
                    if (p) {
                      form.setValue(
                        "patientName",
                        p.full_name ?? p.name ?? "",
                      );
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        patients.length === 0
                          ? "No connected patients — add connections first"
                          : "Select a patient"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name ?? p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {patients.length === 0 && !patientsLoading && (
                  <p className="text-sm text-muted-foreground">
                    Connect with patients from your dashboard to prescribe here.
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <PatientSection form={form} />
                <DoctorSection form={form} />
              </div>

              <div className="text-right text-sm text-gray-600">
                Date: {new Date().toLocaleDateString()}
              </div>

              <MedicationsSection form={form} onAddMedication={addMedication} />

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Saving…" : "Create prescription"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionForm;
