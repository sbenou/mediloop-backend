import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "@/hooks/auth/useAuth";
import ProtectedRoute from "@/components/routing/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, Pencil } from "lucide-react";
import {
  fetchPrescriptionByIdApi,
  type ApiPrescriptionRow,
} from "@/services/clinicalApi";

function PrescriptionDetailInner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [row, setRow] = useState<ApiPrescriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const canEdit =
    profile?.role === "doctor" || profile?.role === "superadmin";

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
        if (!cancelled) setRow(p);
      } catch (e) {
        console.error(e);
        toast({
          variant: "destructive",
          title: "Could not open prescription",
          description: e instanceof Error ? e.message : "Try again",
        });
        if (!cancelled) navigate(-1);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  if (loading || !id) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!row) return null;

  const created = row.created_at
    ? (() => {
        try {
          return format(new Date(row.created_at), "PPpp");
        } catch {
          return row.created_at;
        }
      })()
    : "—";

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {canEdit && (
            <Button
              size="sm"
              onClick={() => navigate(`/edit-prescription/${id}`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Prescription</CardTitle>
            <p className="text-sm text-muted-foreground">Issued {created}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Patient
                </p>
                <p className="text-sm font-medium mt-1">
                  {row.patient_full_name ?? row.patient_id ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Prescriber
                </p>
                <p className="text-sm font-medium mt-1">
                  {row.doctor_full_name ?? row.doctor_id ?? "—"}
                </p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Medication
                </p>
                <p className="text-sm font-medium mt-1">{row.medication_name}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Dosage</p>
                  <p className="text-sm">{row.dosage}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Frequency</p>
                  <p className="text-sm">{row.frequency}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm">{row.duration}</p>
                </div>
              </div>
              {row.notes ? (
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{row.notes}</p>
                </div>
              ) : null}
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm capitalize">{row.status ?? "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const PrescriptionDetail = () => (
  <ProtectedRoute
    allowedRoles={["patient", "doctor", "pharmacist", "superadmin"]}
  >
    <PrescriptionDetailInner />
  </ProtectedRoute>
);

export default PrescriptionDetail;
