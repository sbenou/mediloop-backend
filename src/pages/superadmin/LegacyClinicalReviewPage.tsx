import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  fetchLegacyClinicalReviewApi,
  type LegacyClinicalReviewRow,
} from "@/services/clinicalApi";
import { Loader2 } from "lucide-react";

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "attributed") {
    return <Badge className="bg-emerald-700 hover:bg-emerald-700">attributed</Badge>;
  }
  if (s === "quarantined") {
    return <Badge variant="destructive">quarantined</Badge>;
  }
  if (s === "legacy_pending") {
    return <Badge className="bg-amber-600 hover:bg-amber-600">legacy_pending</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

const LegacyClinicalReviewPage = () => {
  const { profile } = useAuth();
  const [rows, setRows] = useState<LegacyClinicalReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resource, setResource] = useState<string>("all");
  const [attributionStatus, setAttributionStatus] = useState<string>("default");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLegacyClinicalReviewApi({
        resource: resource === "all" ? undefined : resource,
        attribution_status:
          attributionStatus === "default" ? undefined : attributionStatus,
        limit: 200,
      });
      setRows(res.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [resource, attributionStatus]);

  useEffect(() => {
    if (profile?.role === "superadmin") {
      void load();
    }
  }, [profile?.role, load]);

  if (!profile || profile.role !== "superadmin") {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Legacy clinical review is only available to superadmin users.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-[1400px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Legacy clinical review</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Read-only list of prescriptions, teleconsultations, and doctor–patient connections with
            attribution status (Phase 5A). Default filter: legacy_pending + quarantined.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/superadmin/dashboard">← Super Admin</Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Resource</label>
            <Select value={resource} onValueChange={setResource}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="prescriptions">Prescriptions</SelectItem>
                <SelectItem value="teleconsultations">Teleconsultations</SelectItem>
                <SelectItem value="connections">Doctor–patient connections</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Attribution status</label>
            <Select value={attributionStatus} onValueChange={setAttributionStatus}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Queue (legacy_pending + quarantined)</SelectItem>
                <SelectItem value="legacy_pending">legacy_pending only</SelectItem>
                <SelectItem value="quarantined">quarantined only</SelectItem>
                <SelectItem value="attributed">attributed only</SelectItem>
                <SelectItem value="all">all statuses</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6 text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Rows ({rows.length})</CardTitle>
          <CardDescription>
            Each access is audited (admin.legacy_clinical.list). No mutations from this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && rows.length === 0 ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Clinician</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead className="font-mono text-xs">Row id</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-muted-foreground">
                        No rows match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={`${r.resource_type}-${r.id}`}>
                        <TableCell className="whitespace-nowrap">{r.resource_type}</TableCell>
                        <TableCell>{statusBadge(r.attribution_status)}</TableCell>
                        <TableCell>{r.patient.display_name || r.patient.id.slice(0, 8)}…</TableCell>
                        <TableCell>
                          {r.clinician.display_name || r.clinician.id.slice(0, 8)}…
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={r.summary || ""}>
                          {r.summary || "—"}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate">
                          {r.tenant_display_name ||
                            (r.professional_tenant_id ? r.professional_tenant_id.slice(0, 8) + "…" : "—")}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] max-w-[120px] truncate">
                          {r.id}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LegacyClinicalReviewPage;
