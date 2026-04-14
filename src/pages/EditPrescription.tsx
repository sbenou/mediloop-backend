import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { X } from "lucide-react";
import {
  fetchPrescriptionByIdApi,
  updatePrescriptionApi,
  type ApiPrescriptionRow,
} from "@/services/clinicalApi";
import { Textarea } from "@/components/ui/textarea";
import ProtectedRoute from "@/components/routing/ProtectedRoute";
import { getDashboardRouteByRole } from "@/utils/auth/getDashboardRouteByRole";

const EditPrescriptionInner = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [row, setRow] = useState<ApiPrescriptionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "completed">("draft");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const p = await fetchPrescriptionByIdApi(id);
        if (cancelled) return;
        setRow(p);
        setMedicationName(p.medication_name ?? "");
        setDosage(p.dosage ?? "");
        setFrequency(p.frequency ?? "");
        setDuration(p.duration ?? "");
        setNotes(p.notes ?? "");
        const s = (p.status ?? "draft").toLowerCase();
        if (s === "active" || s === "completed" || s === "draft") {
          setStatus(s as "draft" | "active" | "completed");
        }
      } catch (e) {
        console.error(e);
        toast({
          variant: "destructive",
          title: "Could not load prescription",
          description: e instanceof Error ? e.message : "Try again",
        });
        navigate(getDashboardRouteByRole("doctor"), { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const onSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updatePrescriptionApi(id, {
        medication_name: medicationName.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        duration: duration.trim(),
        notes: notes.trim() ? notes.trim() : null,
        status,
      });
      toast({ title: "Saved" });
      navigate(getDashboardRouteByRole("doctor"));
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: e instanceof Error ? e.message : "Try again",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!id || !row) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit prescription</h1>
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">
              Patient: {row.patient_full_name ?? row.patient_id ?? "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rx-med">Medication</Label>
              <Input
                id="rx-med"
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rx-dosage">Dosage</Label>
              <Input
                id="rx-dosage"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rx-freq">Frequency</Label>
              <Input
                id="rx-freq"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rx-dur">Duration</Label>
              <Input
                id="rx-dur"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rx-notes">Notes</Label>
              <Textarea
                id="rx-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setStatus(v as "draft" | "active" | "completed")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={onSave} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const EditPrescription = () => (
  <ProtectedRoute allowedRoles={["doctor", "superadmin"]}>
    <EditPrescriptionInner />
  </ProtectedRoute>
);

export default EditPrescription;
