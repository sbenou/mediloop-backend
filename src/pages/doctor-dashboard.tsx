/**
 * New doctor home UI (Figma-aligned). Does not replace /dashboard; use route /doctor/doctor-dashboard.
 * Reuses DoctorLayout (Mediloop sidebar + UnifiedHeader), same right drawer as role dashboard.
 */
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow, isSameDay, startOfDay } from "date-fns";
import {
  Calendar,
  Camera,
  FileText,
  MessageSquare,
  Share2,
  SidebarClose,
  SidebarOpen,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DoctorLayout from "@/components/layout/DoctorLayout";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { Advertisements } from "@/components/activity/Advertisements";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/auth/useAuth";
import { DOCTOR_HOME_QUERY_KEY, useDoctorStats } from "@/hooks/doctor/useDoctorStats";
import { useDoctorRecentPatients } from "@/hooks/doctor/useDoctorRecentPatients";
import { adaptActivitiesForComponent } from "@/hooks/activity/useActivitiesAdapter";
import { fetchDoctorHomeApi, fetchTeleconsultationsApi } from "@/services/clinicalApi";
import { CartProvider } from "@/contexts/CartContext";
import RequireRoleGuard from "@/components/auth/RequireRoleGuard";
import type { Activity } from "@/hooks/activity/types";
import type { Teleconsultation } from "@/types/clinical";

const ACTIVE_PATIENT_HINTS = ["96%", "115/76", "88%", "102/68", "—", "72 bpm"];

function CompactActivityRow({ activity }: { activity: Activity }) {
  const ts = typeof activity.timestamp === "string"
    ? new Date(activity.timestamp)
    : activity.timestamp;
  const timeLabel = formatDistanceToNow(ts, { addSuffix: true });
  const meta = activity.metadata as { amount?: number; currency?: string } | undefined;
  const amount =
    typeof meta?.amount === "number"
      ? meta.amount.toFixed(2)
      : null;

  return (
    <div className="flex gap-3 border-b border-slate-100 py-3 last:border-0 first:pt-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 leading-snug line-clamp-1">
          {activity.title}
        </p>
        {activity.description ? (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{activity.description}</p>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        {amount != null ? (
          <p className="text-sm font-semibold tabular-nums text-slate-800">€{amount}</p>
        ) : (
          <p className="text-xs text-slate-400">—</p>
        )}
        <p className="text-[11px] text-slate-400 mt-0.5 capitalize">{timeLabel}</p>
      </div>
    </div>
  );
}

const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function mondayIndexFromJsDay(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

function DoctorRightDrawer({
  isOpen,
  setIsOpen,
  activeTab,
  setActiveTab,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  activeTab: string;
  setActiveTab: (v: string) => void;
}) {
  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed right-0 top-20 z-50"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {isOpen ? <SidebarClose className="h-4 w-4" /> : <SidebarOpen className="h-4 w-4" />}
      </Button>
      <div
        className={`fixed inset-y-0 right-0 mt-16 w-[300px] border-l bg-white shadow-md transition-transform duration-300 z-40 overflow-hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 h-full overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="home" className="mt-0">
              <Advertisements />
            </TabsContent>
            <TabsContent value="activity" className="mt-0">
              <ActivityFeed />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

function TodayScheduleList({ doctorId }: { doctorId: string }) {
  const { data: teleconsultations = [], isLoading } = useQuery({
    queryKey: ["teleconsultations", "doctor-dashboard", doctorId],
    queryFn: () => fetchTeleconsultationsApi(),
    enabled: !!doctorId,
  });

  const todays = useMemo(() => {
    const todayStart = startOfDay(new Date());
    return teleconsultations.filter((t) => isSameDay(new Date(t.start_time), todayStart));
  }, [teleconsultations]);

  if (isLoading && todays.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-8 text-center">Loading schedule…</p>
    );
  }

  if (todays.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-8 text-center rounded-2xl bg-slate-50/90 border border-dashed border-slate-200">
        No visits scheduled for today.
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {todays.map((a: Teleconsultation) => {
        const start = new Date(a.start_time);
        const patientName = a.patient?.full_name || "Patient";
        return (
          <li
            key={a.id}
            className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <Avatar className="h-12 w-12 ring-2 ring-slate-100">
              <AvatarImage src={a.patient?.avatar_url || undefined} alt="" />
              <AvatarFallback className="bg-violet-100 text-violet-700 text-sm font-medium">
                {patientName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate text-[15px]">{patientName}</p>
              <p className="text-sm text-slate-500 truncate mt-0.5">
                {a.reason || "Consultation"}
              </p>
            </div>
            <span className="text-sm font-semibold text-violet-600 tabular-nums shrink-0">
              {format(start, "h:mm a")}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function DoctorDashboardPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const doctorId = profile?.id;
  const displayName = profile?.full_name?.split(" ")[0] || "Doctor";

  const [drawerOpen, setDrawerOpen] = useState(true);
  const [drawerTab, setDrawerTab] = useState("home");
  const [scheduleTab, setScheduleTab] = useState("schedule");
  const [dayPick, setDayPick] = useState(() => mondayIndexFromJsDay(new Date().getDay()));

  const { data: stats, isLoading: statsLoading } = useDoctorStats(doctorId);
  const { recentPatients, loading: patientsLoading } = useDoctorRecentPatients(doctorId);
  const { data: adaptedActivities = [], isLoading: actLoading } = useQuery({
    queryKey: [...DOCTOR_HOME_QUERY_KEY],
    queryFn: fetchDoctorHomeApi,
    enabled: !!doctorId,
    select: (d) => adaptActivitiesForComponent(d.activities).slice(0, 6),
  });

  const patientGrowthPct = Math.min(100, Math.max(0, stats?.percent_change ?? 0));

  const quickActions = [
    {
      label: "Start Teleconsultation",
      icon: Camera,
      onClick: () => navigate("/dashboard?section=teleconsultations"),
    },
    {
      label: "Create New Patient",
      icon: UserPlus,
      onClick: () => navigate("/dashboard?section=patients"),
    },
    {
      label: "Create Prescription",
      icon: FileText,
      onClick: () => navigate("/create-prescription"),
    },
    {
      label: "Manage Schedule",
      icon: Calendar,
      onClick: () => navigate("/dashboard?section=appointments"),
    },
    {
      label: "Message",
      icon: MessageSquare,
      onClick: () => navigate("/notifications"),
    },
    {
      label: "Referral Letter",
      icon: Share2,
      onClick: () => navigate("/referral"),
    },
  ] as const;

  return (
    <RequireRoleGuard allowedRoles={["doctor", "superadmin"]}>
      <CartProvider>
        <DoctorLayout>
          <div className="flex flex-1 overflow-hidden relative -m-4 md:-m-6 min-h-[calc(100vh-8rem)]">
            <main
              className={`flex-1 px-4 py-4 md:px-6 md:py-6 overflow-auto transition-all duration-300 ${
                drawerOpen ? "mr-[300px]" : "mr-0"
              }`}
            >
              <ScrollArea className="h-full w-full">
                <div className="max-w-[1180px] mx-auto pb-10 pt-1">
                  <header className="mb-8 md:mb-10">
                    <h1 className="text-3xl md:text-[2rem] font-semibold tracking-tight text-slate-900">
                      Welcome back, Dr. {displayName}
                    </h1>
                    <p className="text-slate-500 text-base mt-2.5">
                      Here is your practice overview.
                    </p>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start">
                    {/* Row 1 — Quick actions (matches Figma tile grid) */}
                    <section
                      className={cn(
                        "rounded-2xl border border-slate-200/90 bg-white p-6 md:p-7",
                        "shadow-[0_1px_3px_rgba(15,23,42,0.06)]",
                      )}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-5">
                        Quick actions
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {quickActions.map(({ label, icon: Icon, onClick }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={onClick}
                            className={cn(
                              "group flex min-h-[118px] flex-col items-center justify-center gap-3 rounded-2xl",
                              "border border-slate-100 bg-slate-50/40 px-2 py-4 text-center transition-all",
                              "hover:border-violet-200 hover:bg-violet-50/60 hover:shadow-md",
                            )}
                          >
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 group-hover:ring-violet-200">
                              <Icon className="h-6 w-6 text-violet-600" strokeWidth={1.75} />
                            </span>
                            <span className="text-[13px] font-medium text-slate-800 leading-tight px-1">
                              {label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* Row 1 — Health overview */}
                    <section
                      className={cn(
                        "rounded-2xl border border-slate-200/90 bg-white p-6 md:p-7",
                        "shadow-[0_1px_3px_rgba(15,23,42,0.06)]",
                      )}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-5">
                        Health overview
                      </p>
                      <div className="flex flex-wrap justify-center gap-8 sm:gap-10">
                        {[
                          {
                            label: "Active Teleconsultations",
                            value: stats?.active_teleconsultations ?? 0,
                            ring: "border-sky-400 text-sky-700",
                          },
                          {
                            label: "Active Consultations",
                            value: stats?.active_consultations ?? 0,
                            ring: "border-violet-500 text-violet-700",
                          },
                          {
                            label: "Active Prescriptions",
                            value: stats?.active_prescriptions ?? 0,
                            ring: "border-emerald-400 text-emerald-700",
                          },
                        ].map((c) => {
                          const n = statsLoading ? null : Number(c.value);
                          const showTrend = !statsLoading && n != null && n > 0;
                          return (
                            <div
                              key={c.label}
                              className="flex flex-col items-center w-[112px] text-center"
                            >
                              <div
                                className={cn(
                                  "flex h-[76px] w-[76px] items-center justify-center rounded-full border-[4px] bg-gradient-to-b from-white to-slate-50/90 text-[1.35rem] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
                                  c.ring,
                                )}
                              >
                                {statsLoading ? "…" : c.value}
                              </div>
                              {showTrend ? (
                                <TrendingUp
                                  className="mt-1.5 h-4 w-4 text-emerald-500"
                                  strokeWidth={2.25}
                                  aria-hidden
                                />
                              ) : (
                                <span className="mt-1.5 h-4" aria-hidden />
                              )}
                              <span className="text-[11px] leading-snug text-slate-500 mt-2">
                                {c.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-7 flex gap-1 rounded-xl bg-slate-100 p-1">
                        {WEEKDAY_SHORT.map((d, i) => {
                          const active = dayPick === i;
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setDayPick(i)}
                              className={cn(
                                "flex-1 rounded-lg py-2.5 text-xs font-semibold transition",
                                active
                                  ? "bg-violet-600 text-white shadow-sm"
                                  : "text-slate-600 hover:bg-white/80",
                              )}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    {/* Row 2 — Today&apos;s schedule / My patients */}
                    <section
                      className={cn(
                        "rounded-2xl border border-slate-200/90 bg-white p-6 md:p-7",
                        "shadow-[0_1px_3px_rgba(15,23,42,0.06)]",
                      )}
                    >
                      <Tabs value={scheduleTab} onValueChange={setScheduleTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-slate-100 rounded-xl mb-5">
                          <TabsTrigger
                            value="schedule"
                            className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                          >
                            Today&apos;s schedule
                          </TabsTrigger>
                          <TabsTrigger
                            value="patients"
                            className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                          >
                            My patients
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="schedule" className="mt-0 focus-visible:outline-none">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                            <Select defaultValue="all">
                              <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/80 text-sm">
                                <SelectValue placeholder="Hospital" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All hospitals</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select defaultValue="all-clinic">
                              <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/80 text-sm">
                                <SelectValue placeholder="Clinic" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all-clinic">All clinics</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {doctorId ? (
                            <TodayScheduleList key={doctorId} doctorId={doctorId} />
                          ) : (
                            <p className="text-sm text-slate-500 py-6 text-center">
                              Sign in to load schedule.
                            </p>
                          )}
                        </TabsContent>

                        <TabsContent value="patients" className="mt-0 focus-visible:outline-none space-y-3">
                          {patientsLoading ? (
                            <p className="text-sm text-slate-500 py-6">Loading patients…</p>
                          ) : (recentPatients?.length ?? 0) === 0 ? (
                            <p className="text-sm text-slate-500 py-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                              No recent patients yet.
                            </p>
                          ) : (
                            <ul className="space-y-2">
                              {(recentPatients ?? []).slice(0, 8).map((p) => (
                                <li key={p.id}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(
                                        `/dashboard?section=patients&patientId=${encodeURIComponent(p.id)}`,
                                      )
                                    }
                                    className="w-full flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-left hover:bg-violet-50/50 transition-colors"
                                  >
                                    <Avatar className="h-11 w-11 ring-2 ring-white">
                                      <AvatarImage src={p.avatar_url || undefined} />
                                      <AvatarFallback className="bg-violet-100 text-violet-700 text-sm">
                                        {(p.full_name ?? "P").slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-semibold text-slate-900 truncate">
                                      {p.full_name ?? "Patient"}
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto rounded-xl border-slate-200"
                            onClick={() => navigate("/dashboard?section=patients")}
                          >
                            View all patients
                          </Button>
                        </TabsContent>
                      </Tabs>

                      <div className="mt-6 pt-5 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                          <span className="font-medium">Patient growth (vs prior month)</span>
                          <span className="tabular-nums font-semibold text-slate-700">
                            {statsLoading ? "—" : `${patientGrowthPct.toFixed(0)}%`}
                          </span>
                        </div>
                        <Progress
                          value={patientGrowthPct}
                          className="h-2.5 rounded-full bg-slate-100 [&>div]:rounded-full [&>div]:bg-violet-500"
                        />
                        {!statsLoading && stats?.total_patients != null ? (
                          <p className="text-[11px] text-slate-400 mt-2 tabular-nums">
                            {stats.total_patients} connected patients
                          </p>
                        ) : null}
                      </div>
                    </section>

                    {/* Row 2 — Active patients + Recent activities (stacked, right column) */}
                    <div className="flex flex-col gap-5 lg:gap-6">
                      <section
                        className={cn(
                          "rounded-2xl border border-slate-200/90 bg-white p-6 md:p-7",
                          "shadow-[0_1px_3px_rgba(15,23,42,0.06)]",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 mb-5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
                              <Users className="h-4 w-4 text-violet-600" strokeWidth={2} />
                            </span>
                            <h2 className="text-base font-semibold text-slate-900">
                              Active patients
                            </h2>
                          </div>
                          <Badge
                            variant="secondary"
                            className="rounded-lg bg-slate-100 text-slate-600 font-medium border-0"
                          >
                            {statsLoading ? "…" : stats?.total_patients ?? 0} total
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {patientsLoading ? (
                            <p className="text-sm text-slate-500">Loading…</p>
                          ) : (recentPatients?.length ?? 0) === 0 ? (
                            <p className="text-sm text-slate-500 py-2">No patients to show.</p>
                          ) : (
                            (recentPatients ?? []).slice(0, 4).map((p, idx) => (
                              <div
                                key={p.id}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/40 px-4 py-3"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <Avatar className="h-11 w-11 ring-2 ring-white shrink-0">
                                    <AvatarImage src={p.avatar_url || undefined} />
                                    <AvatarFallback className="bg-violet-100 text-violet-700">
                                      {(p.full_name ?? "P").slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-sm text-slate-900 truncate">
                                      {p.full_name ?? "Patient"}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">
                                      Follow-up care
                                    </p>
                                  </div>
                                </div>
                                <span className="text-sm font-semibold tabular-nums text-violet-600 shrink-0">
                                  {ACTIVE_PATIENT_HINTS[idx % ACTIVE_PATIENT_HINTS.length]}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </section>

                      <section
                        className={cn(
                          "rounded-2xl border border-slate-200/90 bg-white p-6 md:p-7",
                          "shadow-[0_1px_3px_rgba(15,23,42,0.06)]",
                        )}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 mb-4">
                          Recent activities
                        </p>
                        {actLoading ? (
                          <p className="text-sm text-slate-500">Loading…</p>
                        ) : adaptedActivities.length === 0 ? (
                          <p className="text-sm text-slate-500 py-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                            No recent activity.
                          </p>
                        ) : (
                          <div>
                            {adaptedActivities.map((a) => (
                              <CompactActivityRow key={a.id} activity={a} />
                            ))}
                          </div>
                        )}
                      </section>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </main>
            <DoctorRightDrawer
              isOpen={drawerOpen}
              setIsOpen={setDrawerOpen}
              activeTab={drawerTab}
              setActiveTab={setDrawerTab}
            />
          </div>
        </DoctorLayout>
      </CartProvider>
    </RequireRoleGuard>
  );
}
