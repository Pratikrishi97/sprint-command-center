"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isWeekend,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Flag,
  CircleDashed,
  Sparkles,
  TrendingUp,
  ListChecks,
  Award,
  RefreshCw,
  History as HistoryIcon,
} from "lucide-react";
import { useDashboard, useSprintDetail } from "@/lib/queries";
import {
  STATUS_META,
  type SprintRaw,
  type TaskRaw,
  type TaskStatus,
} from "@/lib/types";
import { fmtDate, fmtDateShort, relativeDay } from "@/lib/sprint";
import { EmployeeAvatar, StatusBadge } from "@/components/sprint/shared";
import { BurndownChart, StatusDonut } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// ============================================================
// Shared helpers
// ============================================================

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Curated subset of statuses for the calendar legend (most common).
const LEGEND_STATUSES: TaskStatus[] = [
  "not_started",
  "planning",
  "in_progress",
  "development",
  "review",
  "testing",
  "blocked",
  "completed",
  "released",
  "cancelled",
];

function dateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function parseDate(s: string | Date | null | undefined): Date | null {
  if (!s) return null;
  const d = typeof s === "string" ? new Date(s) : s;
  return isNaN(d.getTime()) ? null : d;
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// ============================================================
// Calendar types
// ============================================================

interface DayBucket {
  tasks: TaskRaw[];
  sprints: { sprint: SprintRaw; type: "start" | "end" }[];
}

// ============================================================
// Calendar view
// ============================================================

export function CalendarView() {
  const [month, setMonth] = React.useState<Date>(() => startOfMonth(new Date()));
  const { data, isLoading, isError, refetch } = useDashboard();

  // Build the visible 6-week grid.
  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  // Index events by yyyy-MM-dd, filtered to the visible month for perf.
  const eventsByDay = React.useMemo(() => {
    const map: Record<string, DayBucket> = {};
    if (!data) return map;
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    for (const t of data.sprintTasks) {
      const d = parseDate(t.endDate);
      if (!d) continue;
      if (d < monthStart || d > monthEnd) continue;
      const key = dateKey(d);
      if (!map[key]) map[key] = { tasks: [], sprints: [] };
      map[key].tasks.push(t);
    }
    for (const s of data.sprints) {
      const sd = parseDate(s.startDate);
      const ed = parseDate(s.endDate);
      if (sd && sd >= monthStart && sd <= monthEnd) {
        const key = dateKey(sd);
        if (!map[key]) map[key] = { tasks: [], sprints: [] };
        map[key].sprints.push({ sprint: s, type: "start" });
      }
      if (ed && ed >= monthStart && ed <= monthEnd) {
        const key = dateKey(ed);
        if (!map[key]) map[key] = { tasks: [], sprints: [] };
        map[key].sprints.push({ sprint: s, type: "end" });
      }
    }
    return map;
  }, [data, month]);

  // Upcoming (next 7 days) + overdue list.
  const upcomingItems = React.useMemo(() => {
    if (!data) return [];
    const items = [...(data.overdue ?? []), ...(data.upcoming ?? [])];
    return items
      .slice()
      .sort((a, b) => {
        const da = parseDate(a.endDate);
        const db = parseDate(b.endDate);
        if (!da || !db) return 0;
        return da.getTime() - db.getTime();
      })
      .slice(0, 7);
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col gap-4"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sprint-primary/10 ring-1 ring-inset ring-sprint-primary/30">
            <CalendarDays className="h-4 w-4 text-sprint-primary" />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Schedule
            </p>
            <h1 className="text-lg font-semibold text-foreground">Calendar</h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonth(subMonths(month, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonth(startOfMonth(new Date()))}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMonth(addMonths(month, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        {/* Calendar card */}
        <div className="rounded-xl border border-border bg-card/40 p-4">
          {/* Month header */}
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              {format(month, "MMMM yyyy")}
            </h2>
            <span className="text-[11px] text-muted-foreground">
              {data?.sprintTasks.length ?? 0} tasks · {data?.sprints.length ?? 0} sprints
            </span>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-px">
            {WEEKDAY_LABELS.map((d) => (
              <div
                key={d}
                className="px-1.5 pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {isLoading ? (
            <CalendarSkeleton />
          ) : isError ? (
            <CalendarError onRetry={() => refetch()} />
          ) : (
            <>
              {/* Day grid */}
              <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border/40">
                {days.map((day) => {
                  const key = dateKey(day);
                  const bucket = eventsByDay[key];
                  const inMonth = isSameMonth(day, month);
                  const weekend = isWeekend(day);
                  const today = isToday(day);
                  return (
                    <div
                      key={key}
                      className={cn(
                        "min-h-[88px] border-b border-r border-border p-1.5 sm:min-h-[110px]",
                        "flex flex-col gap-1 bg-card/40",
                        !inMonth && "bg-muted/10",
                        weekend && inMonth && "bg-muted/15",
                        today && "ring-1 ring-inset ring-sprint-primary/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[11px] font-medium tabular-nums",
                            !inMonth
                              ? "text-muted-foreground/40"
                              : today
                                ? "bg-sprint-primary text-sprint-primary-foreground font-semibold"
                                : weekend
                                  ? "text-muted-foreground"
                                  : "text-foreground/80"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {today ? (
                          <span className="text-[9px] font-bold uppercase tracking-wide text-sprint-primary">
                            Today
                          </span>
                        ) : null}
                      </div>

                      {/* Sprint chips (full-width emerald) */}
                      {bucket?.sprints.map((s, i) => (
                        <div
                          key={`s-${i}`}
                          title={`Sprint ${s.sprint.number} ${s.type === "start" ? "starts" : "ends"} · ${fmtDateShort(s.type === "start" ? s.sprint.startDate : s.sprint.endDate)}`}
                          className="truncate rounded bg-sprint-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-sprint-primary ring-1 ring-inset ring-sprint-primary/30"
                        >
                          Sprint {s.sprint.number} {s.type === "start" ? "starts" : "ends"}
                        </div>
                      ))}

                      {/* Task chips (colored by status) */}
                      {bucket?.tasks.slice(0, 3).map((task) => {
                        const meta = STATUS_META[task.status];
                        return (
                          <div
                            key={task.id}
                            title={`${task.title} · ${meta.label}`}
                            className={cn(
                              "truncate rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                              meta.bg,
                              meta.text,
                              meta.ring
                            )}
                          >
                            {truncate(task.title, 24)}
                          </div>
                        );
                      })}
                      {bucket && bucket.tasks.length > 3 ? (
                        <div className="text-[9px] text-muted-foreground">
                          +{bucket.tasks.length - 3} more
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Legend
                </span>
                {LEGEND_STATUSES.map((status) => {
                  const meta = STATUS_META[status];
                  return (
                    <div key={status} className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-sm ring-1 ring-inset",
                          meta.bg,
                          meta.ring
                        )}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {meta.label}
                      </span>
                    </div>
                  );
                })}
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-sprint-primary/30 ring-1 ring-inset ring-sprint-primary/40" />
                  <span className="text-[10px] text-muted-foreground">Sprint milestone</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Upcoming / overdue list */}
        <div className="flex flex-col rounded-xl border border-border bg-card/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-sprint-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Upcoming &amp; overdue
              </h3>
            </div>
            <span className="rounded-full bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
              {upcomingItems.length}
            </span>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : upcomingItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-8 text-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-400/70" />
              <p className="text-[12px] font-medium text-foreground">All clear</p>
              <p className="text-[11px] text-muted-foreground">
                No upcoming or overdue tasks in the next 7 days.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[640px] flex-1">
              <ul className="space-y-1.5 pr-2">
                {upcomingItems.map((task) => {
                  const due = parseDate(task.endDate);
                  const overdue = due ? due.getTime() < startOfDay(new Date()).getTime() : false;
                  const isClosed =
                    task.status === "completed" ||
                    task.status === "released" ||
                    task.status === "cancelled";
                  const showOverdue = overdue && !isClosed;
                  return (
                    <li
                      key={task.id}
                      className="rounded-lg border border-border bg-card/40 p-2.5 transition-colors hover:bg-card/60"
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-medium text-foreground">
                            {task.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1",
                                showOverdue ? "text-red-400" : "text-muted-foreground"
                              )}
                            >
                              <Clock className="h-3 w-3" />
                              {due ? relativeDay(due) : "—"}
                            </span>
                            {task.project ? (
                              <>
                                <span className="text-muted-foreground/30">·</span>
                                <span className="truncate">{task.project}</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                        {task.owner ? <EmployeeAvatar employee={task.owner} size="xs" /> : null}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <StatusBadge status={task.status} />
                        {showOverdue ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-red-300 ring-1 ring-inset ring-red-500/30">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Overdue
                          </span>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border">
      {Array.from({ length: 35 }).map((_, i) => (
        <div
          key={i}
          className="min-h-[88px] border-b border-r border-border p-1.5 sm:min-h-[110px]"
        >
          <Skeleton className="h-4 w-5 rounded-full" />
          <Skeleton className="mt-1.5 h-3 w-full" />
          <Skeleton className="mt-1 h-3 w-3/4" />
        </div>
      ))}
    </div>
  );
}

function CalendarError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-red-500/30 bg-red-500/5 py-12 text-center">
      <AlertTriangle className="h-5 w-5 text-red-400" />
      <div>
        <p className="text-sm font-semibold text-foreground">Failed to load calendar</p>
        <p className="text-[11px] text-muted-foreground">Something went wrong fetching sprint data.</p>
      </div>
      <Button size="sm" variant="outline" onClick={onRetry}>
        <RefreshCw className="h-3 w-3" />
        Retry
      </Button>
    </div>
  );
}

// ============================================================
// History view
// ============================================================

export function HistoryView() {
  const { data, isLoading, isError, refetch } = useDashboard();

  // Past sprints: completed (and active for context), sorted desc by number.
  const pastSprints = React.useMemo<SprintRaw[]>(() => {
    if (!data) return [];
    return [...data.sprints]
      .filter((s) => s.status === "completed" || s.status === "active")
      .sort((a, b) => b.number - a.number);
  }, [data]);

  const velocityByNumber = React.useMemo(() => {
    const m: Record<number, { completed: number; planned: number }> = {};
    for (const v of data?.velocity ?? []) {
      m[v.number] = { completed: v.completed, planned: v.planned };
    }
    return m;
  }, [data]);

  const mostRecentCompletedId = React.useMemo<string | null>(() => {
    if (!data) return null;
    const completed = data.sprints
      .filter((s) => s.status === "completed")
      .sort((a, b) => b.number - a.number);
    return completed[0]?.id ?? null;
  }, [data]);

  const [selId, setSelId] = React.useState<string | null>(null);
  // Default-select the most recent completed sprint once data arrives.
  React.useEffect(() => {
    if (!selId && mostRecentCompletedId) {
      setSelId(mostRecentCompletedId);
    }
  }, [selId, mostRecentCompletedId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col gap-4"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sprint-primary/10 ring-1 ring-inset ring-sprint-primary/30">
            <HistoryIcon className="h-4 w-4 text-sprint-primary" />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Archive
            </p>
            <h1 className="text-lg font-semibold text-foreground">Sprint history</h1>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-2.5 py-1 text-[11px] text-muted-foreground">
          <CheckCircle2 className="h-3 w-3 text-sprint-primary" />
          {pastSprints.filter((s) => s.status === "completed").length} completed
        </span>
      </div>

      {isError ? (
        <CalendarError onRetry={() => refetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
          {/* Left rail: past sprints list */}
          <div className="rounded-xl border border-border bg-card/40 p-3 lg:max-h-[calc(100vh-200px)]">
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Past sprints
              </h3>
              <span className="text-[10px] text-muted-foreground/70">{pastSprints.length}</span>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : pastSprints.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-8 text-center">
                <CircleDashed className="h-5 w-5 text-muted-foreground/40" />
                <p className="text-[12px] font-medium text-foreground">No history yet</p>
                <p className="text-[11px] text-muted-foreground">Completed sprints will appear here.</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[60vh] lg:max-h-[calc(100vh-260px)]">
                <ul className="space-y-1.5 pr-2">
                  {pastSprints.map((s) => {
                    const v = velocityByNumber[s.number];
                    const completionPct =
                      v && v.planned > 0 ? Math.round((v.completed / v.planned) * 100) : 0;
                    const active = selId === s.id;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => setSelId(s.id)}
                          className={cn(
                            "w-full rounded-lg border p-2.5 text-left transition-all",
                            active
                              ? "border-sprint-primary/50 bg-sprint-primary/10 ring-1 ring-inset ring-sprint-primary/30"
                              : "border-border bg-card/40 hover:bg-card/60 hover:border-sprint-primary/30"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  Sprint {s.number}
                                </span>
                                {s.status === "active" ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-sprint-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-sprint-primary ring-1 ring-inset ring-sprint-primary/30">
                                    <span className="h-1 w-1 animate-pulse rounded-full bg-sprint-primary" />
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground ring-1 ring-inset ring-muted/40">
                                    Done
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 truncate text-[12px] font-medium text-foreground">
                                {s.name}
                              </p>
                            </div>
                          </div>
                          <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <CalendarDays className="h-2.5 w-2.5" />
                            {fmtDateShort(s.startDate)} → {fmtDateShort(s.endDate)}
                          </p>
                          <div className="mt-2 flex items-center justify-between text-[10px]">
                            <span className="tabular-nums font-semibold text-foreground">
                              {v?.completed ?? 0}
                              <span className="ml-1 font-normal text-muted-foreground">pts</span>
                            </span>
                            <span className="tabular-nums text-muted-foreground">{completionPct}%</span>
                          </div>
                          <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted/60">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                s.status === "active" ? "bg-sprint-primary" : "bg-emerald-500/70"
                              )}
                              style={{ width: `${Math.min(100, Math.max(0, completionPct))}%` }}
                            />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            )}
          </div>

          {/* Right detail */}
          <div className="min-w-0">
            {selId ? (
              <SprintHistoryDetail key={selId} id={selId} />
            ) : (
              <EmptyDetailPrompt />
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function EmptyDetailPrompt() {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/20 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sprint-primary/10 ring-1 ring-inset ring-sprint-primary/30">
        <HistoryIcon className="h-5 w-5 text-sprint-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Select a sprint</p>
        <p className="text-[11px] text-muted-foreground">
          Pick a past sprint from the list to view its full summary.
        </p>
      </div>
    </div>
  );
}

function SprintHistoryDetail({ id }: { id: string }) {
  const { data: detail, isLoading, isError, refetch } = useSprintDetail(id);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !detail) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-red-500/30 bg-red-500/5 py-16 text-center">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <div>
          <p className="text-sm font-semibold text-foreground">Failed to load sprint</p>
          <p className="text-[11px] text-muted-foreground">Something went wrong fetching the sprint detail.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-3 w-3" />
          Retry
        </Button>
      </div>
    );
  }

  const { sprint, burndown, statusDist, workload, velocity } = detail;
  const totalTasks = Object.values(statusDist).reduce((a, b) => a + b, 0);
  const completedCount =
    (statusDist["completed"] ?? 0) + (statusDist["released"] ?? 0);
  const completionPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const topContributors = [...workload]
    .filter((w) => w.completed > 0)
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="space-y-4"
    >
      {/* Header */}
      <div
        className={cn(
          "rounded-xl border border-border bg-card/40 p-5",
          sprint.status === "active" && "border-sprint-primary/30 bg-sprint-primary/5"
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Sprint {sprint.number}
            </p>
            <h2 className="mt-0.5 truncate text-lg font-semibold text-foreground">
              {sprint.name}
            </h2>
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              {fmtDate(sprint.startDate)} → {fmtDate(sprint.endDate)}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset",
              sprint.status === "active"
                ? "bg-sprint-primary/15 text-sprint-primary ring-sprint-primary/30"
                : "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
            )}
          >
            <CheckCircle2 className="h-3 w-3" />
            {sprint.status === "active" ? "Active" : "Completed"}
          </span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <HistoryKpi icon={ListChecks} label="Total tasks" value={totalTasks} />
        <HistoryKpi icon={CheckCircle2} label="Completed" value={completedCount} />
        <HistoryKpi icon={Flag} label="Completion" value={`${completionPct}%`} accent />
        <HistoryKpi
          icon={TrendingUp}
          label="Velocity"
          value={`${velocity.completed}`}
          hint={`of ${velocity.planned} planned`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HistoryCard icon={TrendingUp} title="Burndown">
          {burndown.length > 0 ? (
            <BurndownChart data={burndown} height={240} />
          ) : (
            <HistoryChartEmpty label="No burndown data" />
          )}
        </HistoryCard>
        <HistoryCard icon={Sparkles} title="Status mix">
          {Object.keys(statusDist).length > 0 ? (
            <StatusDonut data={statusDist} height={240} />
          ) : (
            <HistoryChartEmpty label="No status data" />
          )}
        </HistoryCard>
      </div>

      {/* Top contributors */}
      <HistoryCard icon={Award} title="Top contributors" subtitle="By completed story points">
        {topContributors.length > 0 ? (
          <ul className="space-y-2">
            {topContributors.map((w, i) => (
              <li
                key={w.employee.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/40 p-2.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sprint-primary/10 text-[10px] font-bold tabular-nums text-sprint-primary">
                    {i + 1}
                  </span>
                  <EmployeeAvatar employee={w.employee} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-foreground">
                      {w.employee.name}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {w.employee.team} · {w.taskCount} task{w.taskCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted/60">
                    <div
                      className="h-full rounded-full bg-sprint-primary"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (w.completed /
                              Math.max(1, topContributors[0]?.completed ?? 1)) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="w-12 text-right text-[12px] font-semibold tabular-nums text-sprint-primary">
                    {w.completed}
                    <span className="ml-0.5 text-[9px] font-normal text-muted-foreground">pts</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <HistoryChartEmpty label="No contributor data" />
        )}
      </HistoryCard>

      {/* Achievements */}
      {sprint.achievements && sprint.achievements.length > 0 ? (
        <HistoryCard icon={Award} title="Achievements">
          <ul className="space-y-1.5">
            {sprint.achievements.map((a, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[12px] text-muted-foreground"
              >
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-sprint-primary" />
                <span className="text-foreground/90">{a}</span>
              </li>
            ))}
          </ul>
        </HistoryCard>
      ) : null}

      {/* Retrospective snippet */}
      {sprint.retrospective ? (
        <HistoryCard icon={ListChecks} title="Retrospective">
          <p className="line-clamp-6 whitespace-pre-wrap text-[12px] leading-relaxed text-muted-foreground">
            {sprint.retrospective}
          </p>
        </HistoryCard>
      ) : null}
    </motion.div>
  );
}

function HistoryKpi({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/40 p-4",
        accent && "border-sprint-primary/30 bg-sprint-primary/5"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            accent ? "text-sprint-primary" : "text-muted-foreground/70"
          )}
        />
      </div>
      <p
        className={cn(
          "mt-1.5 text-xl font-semibold tabular-nums text-foreground",
          accent && "text-sprint-primary"
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[10px] text-muted-foreground/80">{hint}</p> : null}
    </div>
  );
}

function HistoryCard({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-sprint-primary/10 ring-1 ring-inset ring-sprint-primary/20">
            <Icon className="h-3.5 w-3.5 text-sprint-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {subtitle ? (
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

function HistoryChartEmpty({ label }: { label: string }) {
  return (
    <div className="flex h-[240px] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-center">
      <CircleDashed className="h-5 w-5 text-muted-foreground/40" />
      <p className="text-[12px] font-medium text-foreground">{label}</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
      <Skeleton className="h-[220px] rounded-xl" />
    </div>
  );
}
