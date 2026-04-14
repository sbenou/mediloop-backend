import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import {
  fetchRotationQueueHealth,
  type RotationQueueItem,
} from "@/services/tokenRotationClient";

const RotationQueuePage = () => {
  const { profile } = useAuth();
  const [rows, setRows] = useState<RotationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRotationQueueHealth(200);
      setRows(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load queue health");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
              Token rotation queue health is only available to superadmin users.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-[1300px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Token rotation queue health</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Read-only snapshot of Deno KV rotation queue retries and last errors.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
          <Button variant="outline" asChild>
            <Link to="/superadmin/dashboard">← Super Admin</Link>
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6 text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Queue entries ({rows.length})</CardTitle>
          <CardDescription>
            Sorted by next attempt time. Entries are dropped automatically after max retry threshold.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && rows.length === 0 ? (
            <div className="flex justify-center py-10 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Failed attempts</TableHead>
                    <TableHead>Next attempt</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Last error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground">
                        Queue is empty.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.sessionId}>
                        <TableCell className="font-mono text-xs">{r.sessionId}</TableCell>
                        <TableCell className="font-mono text-xs">{r.userId}</TableCell>
                        <TableCell>
                          <Badge variant={r.failedAttempts > 0 ? "destructive" : "secondary"}>
                            {r.failedAttempts}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(r.nextAttemptAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(r.expiresAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="max-w-[340px] truncate text-xs" title={r.lastError || ""}>
                          {r.lastError || "—"}
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

export default RotationQueuePage;

