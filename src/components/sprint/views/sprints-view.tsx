"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AlertTriangle,
  CalendarDays,
  Flag,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  Gauge,
  ListChecks,
  Target,
  Users,
  StickyNote,
  Sparkles,
  ClipboardList,
  AlertOctagon,
  CalendarClock,
  CircleDashed,
  TimerReset,
  Activity,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useDashboard,
  useSprintDetail,
  useUpdateSprint,
  type SprintDetail,
} from "@/lib/queries";
import { useUI } from "@/stores/ui";
import {
  STATUS_META,
  RISK_META,
  type SprintRaw,
  type TaskStatus,
  type RiskLevel,
  type NoteRaw,
  type EmployeeRaw,
} from "@/lib/types";
import { fmtDate, fmtDateShort, daysUntil, getSprintByNumber } from "@/lib/sprint";
import {
  EmployeeAvatar,
  ProgressRing,
} from "@/components/sprint/shared";
import {
  BurndownChart,
  BurnupChart,
  VelocityChart,
  WorkloadChart,
  StatusDonut,
  SimpleBar,
} from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// ============================================================
// Helpers
// ============================================================

type SprintStatus = SprintRaw["status"];

const SPRINT_STATUS_META: Record<
  SprintStatus,
  { label: string; dot: string; text: string; bg: string; ring: string; border: string }
> = {
  active: {
    label: "Active",
    dot: "bg-sprint-primary",
    text: "text-sprint-primary",
    bg: "bg-sprint-primary/15",
    ring: "ring-sprint-primary/30",
    border: "border-sprint-primary/50",
  },
  upcoming: {
    label: "Upcoming",
    dot: "bg-amber-400",
    text: "text-amber-300",
    bg: "bg-amber-500/15",
    ring: "ring-amber-500/30",
    border: "border-amber-500/40",
  },
  completed: {
    label: "Completed",
    dot: "bg-muted-foreground/50",
    text: "text-muted-foreground",
    bg: "bg-muted/40",
    ring: "ring-muted/40",
    border: "border-border",
  },
};

function utilizationBarColor(u: number): string {
  if (u > 100) return "bg-red-500";
  if (u >= 85) return "bg-amber-500";
  return "bg-emerald-500";
}

function utilizationTextColor(u: number): string {
  if (u > 100) return "text-red-400";
  if (u >= 85) return "text-amber-400";
  return "text-emerald-400";
}

const NOTE_TYPE_META: Record<
  NoteRaw["type"],
  { label: string; className: string }
> = {
  general: { label: "General", className: "bg-slate-500/15 text-slate-300 ring-slate-500/30" },
  blocker: { label: "Blocker", className: "bg-red-500/15 text-red-300 ring-red-500/30" },
  risk: { label: "Risk", className: "bg-orange-500/15 text-orange-300 ring-orange-500/30" },
  achievement: {
    label: "Achievement",
    className: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  },
  retro: { label: "Retro", className: "bg-violet-500/15 text-violet-300 ring-violet-500/30" },
};

function MiniStat({
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
        <Icon className={cn("h-3.5 w-3.5", accent ? "text-sprint-primary" : "text-muted-foreground/70")} />
      </div>
      <p className="mt-1.5 text-xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint ? (
        <p className="mt-0.5 text-[10px] text-muted-foreground/80">{hint}</p>
      ) : null}
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card/40 p-5", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-sprint-primary" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-8 text-center">
      <Icon className="h-5 w-5 text-muted-foreground/40" />
      <p className="text-[12px] font-medium text-foreground">{title}</p>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

// ============================================================
// Sprints List (default)
// ============================================================

function SprintRow({
  sprint,
  velocity,
  onSelect,
}: {
  sprint: SprintRaw;
  velocity?: { completed: number; planned: number };
  onSelect: () => void;
}) {
  const meta = SPRINT_STATUS_META[sprint.status];
  const startDays = daysUntil(sprint.startDate);
  const endDays = daysUntil(sprint.endDate);
  const completed = velocity?.completed ?? 0;
  const planned = velocity?.planned ?? 0;
  const completionPct = planned > 0 ? Math.round((completed / planned) * 100) : 0;

  let statusLine: React.ReactNode;
  if (sprint.status === "active") {
    const remaining = Math.max(0, endDays);
    statusLine = (
      <span className="inline-flex items-center gap-1 text-[11px] text-sprint-primary">
        <TimerReset className="h-3 w-3" />
        {remaining === 0 ? "Ends today" : `${remaining} day${remaining === 1 ? "" : "s"} remaining`}
      </span>
    );
  } else if (sprint.status === "upcoming") {
    const d = Math.max(0, startDays);
    statusLine = (
      <span className="inline-flex items-center gap-1 text-[11px] text-amber-300">
        <CalendarClock className="h-3 w-3" />
        {d === 0 ? "Starts today" : `Starts in ${d} day${d === 1 ? "" : "s"}`}
      </span>
    );
  } else {
    statusLine = (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </span>
    );
  }

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onSelect}
      className={cn(
        "group relative flex w-full items-center gap-4 rounded-xl border bg-card/40 p-4 text-left transition-all",
        "hover:-translate-y-0.5 hover:bg-card/60 hover:shadow-lg hover:shadow-sprint-primary/5",
        sprint.status === "active"
          ? cn("border-sprint-primary/50 ring-1 ring-sprint-primary/30", "hover:border-sprint-primary/70")
          : "border-border hover:border-sprint-primary/30"
      )}
    >
      {/* Timeline dot + connector */}
      <div className="relative flex h-full flex-col items-center self-stretch">
        <span
          className={cn(
            "mt-0.5 inline-flex h-3 w-3 rounded-full ring-4 ring-background",
            meta.dot,
            sprint.status === "active" && "shadow-[0_0_10px_var(--sprint-primary)]"
          )}
        />
        <span className="mt-1 w-px flex-1 bg-gradient-to-b from-border to-transparent" />
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            <span className="text-muted-foreground">Sprint {sprint.number}</span>
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            <span className="text-foreground">{sprint.name}</span>
          </h3>
          {sprint.status === "active" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-sprint-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sprint-primary ring-1 ring-inset ring-sprint-primary/30">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sprint-primary" />
              Active
            </span>
          ) : null}
          {sprint.status === "upcoming" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300 ring-1 ring-inset ring-amber-500/30">
              Upcoming
            </span>
          ) : null}
          {sprint.status === "completed" ? (
            <span className="inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ring-1 ring-inset ring-muted/40">
              Completed
            </span>
          ) : null}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {fmtDateShort(sprint.startDate)} → {fmtDateShort(sprint.endDate)}
          </span>
          <span className="text-muted-foreground/30">·</span>
          {statusLine}
        </div>

        {/* Completion bar */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Completion</span>
            <span className="tabular-nums">
              <span className="font-semibold text-foreground">{completed}</span>
              <span className="text-muted-foreground/60"> / {planned} pts</span>
              <span className="ml-1.5 text-muted-foreground">·</span>
              <span className="ml-1.5 font-semibold text-foreground tabular-nums">{completionPct}%</span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                sprint.status === "completed"
                  ? "bg-emerald-500/70"
                  : sprint.status === "active"
                    ? "bg-sprint-primary"
                    : "bg-amber-500/60"
              )}
              style={{ width: `${Math.min(100, Math.max(0, completionPct))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right side velocity */}
      <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Velocity</span>
        <span className="text-lg font-bold tabular-nums text-foreground">
          {completed}
          <span className="ml-1 text-[11px] font-medium text-muted-foreground">pts</span>
        </span>
        <span className="text-[10px] text-muted-foreground/70">of {planned} planned</span>
      </div>
    </motion.button>
  );
}

function SprintsList() {
  const { data, isLoading, isError, refetch } = useDashboard();
  const setSelectedSprintId = useUI((s) => s.setSelectedSprintId);

  const velocityByNumber = React.useMemo(() => {
    const m: Record<number, { completed: number; planned: number }> = {};
    for (const v of data?.velocity ?? []) {
      m[v.number] = { completed: v.completed, planned: v.planned };
    }
    return m;
  }, [data]);

  const sprints = React.useMemo(() => {
    return [...(data?.sprints ?? [])].sort((a, b) => b.number - a.number);
  }, [data]);

  const currentSprint = data?.sprint;
  const activeCount = sprints.filter((s) => s.status === "active").length;
  const completedCount = sprints.filter((s) => s.status === "completed").length;
  const upcomingCount = sprints.filter((s) => s.status === "upcoming").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col gap-4"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card/40 px-3">
            <CalendarClock className="h-4 w-4 text-sprint-primary" />
            <span className="truncate text-[13px] font-semibold text-foreground">Sprints</span>
            <span className="rounded-full bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
              {sprints.length}
            </span>
          </div>

          {currentSprint ? (
            <button
              onClick={() => setSelectedSprintId(currentSprint.id)}
              className="hidden items-center gap-2 rounded-lg border border-sprint-primary/30 bg-sprint-primary/5 px-3 py-1.5 text-[11px] transition-colors hover:bg-sprint-primary/10 sm:flex"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sprint-primary" />
              <span className="text-muted-foreground">Current:</span>
              <span className="font-semibold text-sprint-primary">
                Sprint {currentSprint.number}
              </span>
              <span className="text-muted-foreground/60">·</span>
              <span className="text-muted-foreground">
                {daysUntil(currentSprint.endDate) > 0
                  ? `${daysUntil(currentSprint.endDate)}d left`
                  : "Ends today"}
              </span>
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sprint-primary" />
            {activeCount} active
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            {upcomingCount} upcoming
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
            {completedCount} done
          </span>
        </div>
      </div>

      {/* Timeline list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 rounded-xl border border-border bg-card/40 p-4">
              <Skeleton className="mt-1 h-3 w-3 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-72" />
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          <p className="text-sm font-medium text-foreground">Failed to load sprints</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : sprints.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <CircleDashed className="h-6 w-6 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">No sprints yet</p>
          <p className="text-xs text-muted-foreground">Sprints will appear here once created.</p>
        </div>
      ) : (
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-3 pb-4">
            {sprints.map((s) => (
              <SprintRow
                key={s.id}
                sprint={s}
                velocity={velocityByNumber[s.number]}
                onSelect={() => setSelectedSprintId(s.id)}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </motion.div>
  );
}

// ============================================================
// Editable helpers (save on blur)
// ============================================================

function EditableTextList({
  items,
  placeholder,
  onCommit,
  emptyHint,
}: {
  items: string[];
  placeholder: string;
  onCommit: (next: string[]) => void;
  emptyHint: string;
}) {
  const [local, setLocal] = React.useState<string[]>(items);
  const [draft, setDraft] = React.useState("");

  React.useEffect(() => {
    setLocal(items);
  }, [items]);

  const commit = (next: string[]) => {
    setLocal(next);
    onCommit(next);
  };

  const updateItem = (idx: number, value: string) => {
    const next = local.map((it, i) => (i === idx ? value : it));
    setLocal(next);
  };

  const removeItem = (idx: number) => {
    commit(local.filter((_, i) => i !== idx));
  };

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    commit([...local, v]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      {local.length === 0 ? (
        <p className="rounded-md bg-muted/30 px-2.5 py-1.5 text-[11px] italic text-muted-foreground">
          {emptyHint}
        </p>
      ) : (
        local.map((item, idx) => (
          <div key={idx} className="group flex items-start gap-1.5">
            <Textarea
              value={item}
              onChange={(e) => updateItem(idx, e.target.value)}
              onBlur={() => commit(local)}
              rows={1}
              className="min-h-[34px] flex-1 resize-none bg-card/60 text-[12px] leading-relaxed"
              placeholder={placeholder}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => removeItem(idx)}
              className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
              title="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))
      )}
      <div className="flex items-center gap-1.5">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={`Add ${placeholder.toLowerCase()}…`}
          className="h-8 flex-1 bg-card/60 text-[12px]"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={add}
          disabled={!draft.trim()}
          className="h-8 border-sprint-primary/30 text-sprint-primary hover:bg-sprint-primary/10 hover:text-sprint-primary"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function EditableRetrospective({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (v: string) => void;
}) {
  const [local, setLocal] = React.useState(value);
  React.useEffect(() => setLocal(value), [value]);
  return (
    <Textarea
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onCommit(local);
      }}
      rows={8}
      placeholder="Capture what went well, what didn't, and what to try next time…"
      className="bg-card/60 text-[12px] leading-relaxed"
    />
  );
}

// ============================================================
// KPI Row
// ============================================================

function KpiRow({ detail }: { detail: SprintDetail }) {
  const { sprint, tasks, totalEstimate, completedEstimate, velocity, workload } = detail;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (t) => t.status === "completed" || t.status === "released" || t.status === "ready_for_release"
  ).length;
  const completionPct =
    totalEstimate > 0 ? Math.round((completedEstimate / totalEstimate) * 100) : 0;
  const remainingEstimate = Math.max(0, totalEstimate - completedEstimate);
  const capacityPts = sprint.capacity || workload.reduce((s, w) => s + w.capacity, 0);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <MiniStat
        icon={ListChecks}
        label="Total tasks"
        value={totalTasks}
        hint={`${tasks.filter((t) => t.status === "blocked").length} blocked`}
      />
      <MiniStat
        icon={CheckCircle2}
        label="Completed"
        value={completedTasks}
        hint={`${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% of tasks`}
      />
      <div className="rounded-xl border border-sprint-primary/30 bg-sprint-primary/5 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Completion
          </span>
          <Gauge className="h-3.5 w-3.5 text-sprint-primary" />
        </div>
        <div className="mt-1 flex items-center gap-3">
          <ProgressRing value={completionPct} size={44} stroke={4} />
          <div>
            <p className="text-xl font-semibold tabular-nums text-foreground">{completionPct}%</p>
            <p className="text-[10px] text-muted-foreground/80">
              {completedEstimate} / {totalEstimate} pts
            </p>
          </div>
        </div>
      </div>
      <MiniStat
        icon={TrendingUp}
        label="Velocity"
        value={`${velocity.completed}`}
        hint={`of ${velocity.planned} planned`}
        accent
      />
      <MiniStat
        icon={Target}
        label="Capacity"
        value={capacityPts ? `${capacityPts}` : "—"}
        hint={capacityPts ? "story points" : undefined}
      />
      <MiniStat
        icon={TimerReset}
        label="Remaining"
        value={`${remainingEstimate}`}
        hint="pts to deliver"
      />
    </div>
  );
}

// ============================================================
// Detail header
// ============================================================

function SprintHeader({ detail }: { detail: SprintDetail }) {
  const { sprint, totalEstimate, completedEstimate } = detail;
  const meta = SPRINT_STATUS_META[sprint.status];
  const endDays = daysUntil(sprint.endDate);
  const startDays = daysUntil(sprint.startDate);
  const info = getSprintByNumber(sprint.number);
  const completionPct =
    totalEstimate > 0 ? Math.round((completedEstimate / totalEstimate) * 100) : 0;
  const calendarPct = info?.progressPct ?? 0;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card/40 p-5",
        sprint.status === "active" ? "border-sprint-primary/40" : "border-border"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset",
                meta.bg,
                meta.text,
                meta.ring
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
              {meta.label}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Sprint {sprint.number}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-foreground">{sprint.name}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {fmtDate(sprint.startDate)} → {fmtDate(sprint.endDate)}
            </span>
            <span className="text-muted-foreground/30">·</span>
            {sprint.status === "active" ? (
              <span className="inline-flex items-center gap-1.5 text-sprint-primary">
                <TimerReset className="h-3.5 w-3.5" />
                {endDays === 0 ? "Ends today" : `${endDays} day${endDays === 1 ? "" : "s"} remaining`}
              </span>
            ) : sprint.status === "upcoming" ? (
              <span className="inline-flex items-center gap-1.5 text-amber-300">
                <CalendarClock className="h-3.5 w-3.5" />
                {startDays === 0 ? "Starts today" : `Starts in ${startDays} day${startDays === 1 ? "" : "s"}`}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completed · {completedEstimate} pts delivered
              </span>
            )}
          </div>
        </div>

        {/* Right side progress */}
        <div className="flex items-center gap-5">
          <div className="hidden flex-col items-end gap-1 sm:flex">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {sprint.status === "active" ? "Calendar progress" : "Final completion"}
            </span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted/60">
                <div
                  className="h-full rounded-full bg-sprint-primary transition-all"
                  style={{
                    width: `${Math.min(100, sprint.status === "active" ? calendarPct : completionPct)}%`,
                  }}
                />
              </div>
              <span className="text-[11px] font-semibold tabular-nums text-foreground">
                {sprint.status === "active" ? calendarPct : completionPct}%
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground/70">
              {completedEstimate} / {totalEstimate} pts done
            </span>
          </div>
          <ProgressRing value={completionPct} size={64} stroke={6} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Overview Tab
// ============================================================

function OverviewTab({
  detail,
  onUpdate,
}: {
  detail: SprintDetail;
  onUpdate: (body: Record<string, unknown>) => void;
}) {
  const { sprint, statusDist, riskDist } = detail;
  const sprintId = sprint.id;

  const statusEntries = Object.entries(statusDist).filter(([, v]) => v > 0);
  const riskEntries = Object.entries(riskDist).filter(([, v]) => v > 0);

  const riskBarData = riskEntries.map(([k, v]) => {
    const meta = RISK_META[k as RiskLevel];
    const colorMap: Record<string, string> = {
      low: "oklch(0.7 0.14 158)",
      medium: "oklch(0.75 0.15 80)",
      high: "oklch(0.7 0.16 55)",
      critical: "oklch(0.62 0.2 25)",
    };
    return {
      name: meta?.label ?? k,
      value: v,
      color: colorMap[k] ?? "var(--chart-2)",
    };
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {/* Goals */}
        <SectionCard title="Sprint goals" icon={Flag}>
          <EditableTextList
            items={sprint.goals}
            placeholder="Sprint goal"
            emptyHint="No goals defined yet."
            onCommit={(goals) => onUpdate({ goals })}
          />
        </SectionCard>

        {/* Achievements */}
        <SectionCard
          title="Achievements"
          icon={Sparkles}
          action={
            <span className="text-[10px] text-muted-foreground">
              {sprint.achievements.length} item{sprint.achievements.length === 1 ? "" : "s"}
            </span>
          }
        >
          {sprint.achievements.length > 0 ? (
            <ul className="space-y-2">
              {sprint.achievements.map((a, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-[12px] text-foreground/90"
                >
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sprint-primary" />
                  <span className="leading-relaxed">{a}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Sparkles} title="No achievements recorded" hint="Wins will show up here." />
          )}
        </SectionCard>

        {/* Risks */}
        <SectionCard
          title="Sprint risks"
          icon={AlertOctagon}
          action={
            <span className="text-[10px] text-muted-foreground">
              {sprint.risks.length} risk{sprint.risks.length === 1 ? "" : "s"}
            </span>
          }
        >
          {sprint.risks.length > 0 ? (
            <div className="space-y-2">
              {sprint.risks.map((r, i) => {
                const rm = RISK_META[r.level];
                return (
                  <div
                    key={i}
                    className="rounded-md border border-border/60 bg-muted/20 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[12px] font-medium text-foreground">{r.title}</p>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          rm.bg,
                          rm.text
                        )}
                      >
                        {rm.label} Risk
                      </span>
                    </div>
                    {r.mitigation ? (
                      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                        <span className="font-medium text-foreground/80">Mitigation:</span>{" "}
                        {r.mitigation}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={AlertOctagon} title="No risks tracked" hint="Risks added to this sprint appear here." />
          )}
        </SectionCard>
      </div>

      {/* Right column: distributions */}
      <div className="space-y-4">
        <SectionCard title="Status distribution" icon={Activity}>
          {statusEntries.length > 0 ? (
            <div>
              <StatusDonut data={statusDist} height={200} />
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {statusEntries.map(([status, count]) => {
                  const m = STATUS_META[status as TaskStatus];
                  return (
                    <div
                      key={status}
                      className="flex items-center justify-between rounded-md bg-muted/30 px-2 py-1 text-[11px]"
                    >
                      <span className={cn("inline-flex items-center gap-1.5 truncate", m?.text)}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        <span className="truncate">{m?.label ?? status}</span>
                      </span>
                      <span className="font-semibold tabular-nums text-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState icon={Activity} title="No tasks yet" />
          )}
        </SectionCard>

        <SectionCard title="Risk distribution" icon={AlertOctagon}>
          {riskBarData.length > 0 ? (
            <SimpleBar data={riskBarData} horizontal height={Math.max(140, riskBarData.length * 36)} />
          ) : (
            <EmptyState icon={AlertOctagon} title="No risks flagged" />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

// ============================================================
// Burndown Tab
// ============================================================

function BurndownTab({ detail }: { detail: SprintDetail }) {
  const { burndown, burnup, velocity, sprint } = detail;
  const hasBurndown = burndown.length > 0;
  const hasBurnup = burnup.length > 0;
  const ad = burndown.find((b) => b.isToday)?.actual ?? burndown[burndown.length - 1]?.actual ?? 0;
  const idealToday = burndown.find((b) => b.isToday)?.ideal ?? burndown[burndown.length - 1]?.ideal ?? 0;
  const delta = ad - idealToday;

  return (
    <div className="space-y-4">
      {/* Velocity stat strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat icon={TrendingUp} label="Planned" value={`${velocity.planned}`} hint="story points" />
        <MiniStat
          icon={CheckCircle2}
          label="Completed"
          value={`${velocity.completed}`}
          hint={`${velocity.planned > 0 ? Math.round((velocity.completed / velocity.planned) * 100) : 0}% of plan`}
          accent
        />
        <MiniStat
          icon={Gauge}
          label="Today vs ideal"
          value={`${ad}`}
          hint={
            delta === 0
              ? "on track"
              : delta > 0
                ? `${delta} pts behind`
                : `${Math.abs(delta)} pts ahead`
          }
        />
        <MiniStat
          icon={TimerReset}
          label="Remaining"
          value={`${ad}`}
          hint={sprint.status === "active" ? "to burn down" : "final"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="Burndown"
          icon={TrendingDown}
          action={
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full bg-sprint-primary" /> Actual
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full border-t border-dashed border-muted-foreground/50" /> Ideal
              </span>
            </div>
          }
        >
          {hasBurndown ? (
            <BurndownChart data={burndown} height={280} />
          ) : (
            <EmptyState icon={TrendingDown} title="No burndown data" hint="Data appears as the sprint progresses." />
          )}
        </SectionCard>

        <SectionCard
          title="Burnup"
          icon={TrendingUp}
          action={
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full bg-sprint-primary" /> Completed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full border-t border-dashed border-muted-foreground/50" /> Scope
              </span>
            </div>
          }
        >
          {hasBurnup ? (
            <BurnupChart data={burnup} height={280} />
          ) : (
            <EmptyState icon={TrendingUp} title="No burnup data" hint="Data appears as the sprint progresses." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

// ============================================================
// Team Tab
// ============================================================

function TeamTab({ detail }: { detail: SprintDetail }) {
  const { workload } = detail;
  const sorted = React.useMemo(
    () => [...workload].filter((w) => w.taskCount > 0).sort((a, b) => b.estimate - a.estimate),
    [workload]
  );

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <SectionCard
        title="Team workload"
        icon={Users}
        className="xl:col-span-2"
        action={
          <span className="text-[10px] text-muted-foreground">
            {sorted.length} member{sorted.length === 1 ? "" : "s"} with tasks
          </span>
        }
      >
        {sorted.length > 0 ? (
          <WorkloadChart data={sorted} height={Math.max(220, sorted.length * 32)} />
        ) : (
          <EmptyState icon={Users} title="No workload data" hint="Assign tasks to see workload." />
        )}
      </SectionCard>

      <SectionCard title="Members" icon={Users}>
        {sorted.length > 0 ? (
          <ScrollArea className="max-h-[420px] pr-2">
            <div className="space-y-2">
              {sorted.map((w) => {
                const e: EmployeeRaw = w.employee;
                const util = w.utilization;
                return (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-2.5"
                  >
                    <EmployeeAvatar employee={e} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-foreground">{e.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {w.taskCount} task{w.taskCount === 1 ? "" : "s"} · {w.estimate} pts
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={cn(
                          "text-[11px] font-semibold tabular-nums",
                          utilizationTextColor(util)
                        )}
                      >
                        {util}%
                      </span>
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-muted/60">
                        <div
                          className={cn("h-full rounded-full", utilizationBarColor(util))}
                          style={{ width: `${Math.min(100, util)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <EmptyState icon={Users} title="No team members" />
        )}
      </SectionCard>
    </div>
  );
}

// ============================================================
// Retrospective Tab
// ============================================================

function RetrospectiveTab({
  detail,
  onUpdate,
}: {
  detail: SprintDetail;
  onUpdate: (body: Record<string, unknown>) => void;
}) {
  const { sprint } = detail;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <SectionCard title="Retrospective" icon={ClipboardList}>
        <EditableRetrospective
          value={sprint.retrospective}
          onCommit={(retrospective) => onUpdate({ retrospective })}
        />
      </SectionCard>

      <div className="space-y-4">
        <SectionCard title="Lessons learned" icon={Sparkles}>
          <EditableTextList
            items={sprint.lessonsLearned}
            placeholder="Lesson learned"
            emptyHint="No lessons captured yet."
            onCommit={(lessonsLearned) => onUpdate({ lessonsLearned })}
          />
        </SectionCard>

        <SectionCard title="Action items" icon={ClipboardList}>
          <EditableTextList
            items={sprint.actionItems}
            placeholder="Action item"
            emptyHint="No action items yet."
            onCommit={(actionItems) => onUpdate({ actionItems })}
          />
        </SectionCard>
      </div>

      <SectionCard
        title="Sprint risks"
        icon={AlertOctagon}
        className="lg:col-span-2"
        action={
          <span className="text-[10px] text-muted-foreground">
            {sprint.risks.length} risk{sprint.risks.length === 1 ? "" : "s"}
          </span>
        }
      >
        {sprint.risks.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {sprint.risks.map((r, i) => {
              const rm = RISK_META[r.level];
              return (
                <div
                  key={i}
                  className="rounded-md border border-border/60 bg-muted/20 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12px] font-medium text-foreground">{r.title}</p>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        rm.bg,
                        rm.text
                      )}
                    >
                      {rm.label} Risk
                    </span>
                  </div>
                  {r.mitigation ? (
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground/80">Mitigation:</span>{" "}
                      {r.mitigation}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={AlertOctagon} title="No risks tracked" />
        )}
      </SectionCard>
    </div>
  );
}

// ============================================================
// Notes Tab
// ============================================================

function NotesTab({ detail }: { detail: SprintDetail }) {
  const { notes } = detail;

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
        <StickyNote className="h-6 w-6 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">No notes for this sprint</p>
        <p className="text-xs text-muted-foreground">
          Notes tagged with this sprint will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {notes.map((n) => {
        const meta = NOTE_TYPE_META[n.type];
        const employee = n.employee;
        return (
          <div
            key={n.id}
            className="rounded-xl border border-border bg-card/40 p-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ring-inset",
                  meta.className
                )}
              >
                {meta.label}
              </span>
              <span className="text-[10px] text-muted-foreground/70">
                {fmtDate(n.createdAt)}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-foreground/85">
              {n.content}
            </p>
            {employee ? (
              <div className="mt-2.5 flex items-center gap-1.5 border-t border-border/60 pt-2">
                <EmployeeAvatar employee={employee} size="xs" ring={false} />
                <span className="text-[10px] text-muted-foreground">{employee.name}</span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Velocity Strip
// ============================================================

function VelocityStrip({ detail }: { detail: SprintDetail }) {
  const { sprint } = detail;
  const { data } = useDashboard();
  const velocityData = React.useMemo(() => {
    const list = [...(data?.velocity ?? [])].sort((a, b) => a.number - b.number);
    // include current sprint's own velocity as the latest point if not already present
    if (!list.find((v) => v.number === sprint.number)) {
      list.push({
        sprint: `S${sprint.number}`,
        number: sprint.number,
        completed: detail.velocity.completed,
        planned: detail.velocity.planned,
        status: sprint.status,
      });
      list.sort((a, b) => a.number - b.number);
    }
    // last 8 sprints
    return list.slice(-8).map((v) => ({
      sprint: v.sprint,
      completed: v.completed,
      planned: v.planned,
      status: v.status,
    }));
  }, [data, detail, sprint]);

  if (velocityData.length === 0) return null;

  return (
    <SectionCard
      title="Recent velocity"
      icon={TrendingUp}
      action={
        <span className="text-[10px] text-muted-foreground">
          Last {velocityData.length} sprints
        </span>
      }
    >
      <VelocityChart data={velocityData} height={200} />
    </SectionCard>
  );
}

// ============================================================
// Sprint Detail
// ============================================================

function SprintDetail({ id }: { id: string }) {
  const setSelectedSprintId = useUI((s) => s.setSelectedSprintId);
  const query = useSprintDetail(id);
  const update = useUpdateSprint();
  const [tab, setTab] = React.useState("overview");

  const detail = query.data;

  const handleUpdate = React.useCallback(
    (body: Record<string, unknown>) => {
      update.mutate({ id, body });
    },
    [id, update]
  );

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedSprintId(null)}
          className="w-fit text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All sprints
        </Button>
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-8 w-80 rounded-lg" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (query.isError || !detail) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedSprintId(null)}
          className="w-fit text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All sprints
        </Button>
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          <p className="text-sm font-medium text-foreground">Failed to load sprint</p>
          <Button size="sm" variant="outline" onClick={() => query.refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col gap-4"
    >
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSelectedSprintId(null)}
        className="w-fit text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All sprints
      </Button>

      {/* Header */}
      <SprintHeader detail={detail} />

      {/* KPI row */}
      <KpiRow detail={detail} />

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1">
        <TabsList>
          <TabsTrigger value="overview">
            <LayoutDashboard className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="burndown">
            <TrendingDown className="h-3.5 w-3.5" /> Burndown
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-3.5 w-3.5" /> Team
          </TabsTrigger>
          <TabsTrigger value="retro">
            <ClipboardList className="h-3.5 w-3.5" /> Retrospective
          </TabsTrigger>
          <TabsTrigger value="notes">
            <StickyNote className="h-3.5 w-3.5" /> Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-3">
          <OverviewTab detail={detail} onUpdate={handleUpdate} />
        </TabsContent>
        <TabsContent value="burndown" className="mt-3">
          <div className="space-y-4">
            <BurndownTab detail={detail} />
            <VelocityStrip detail={detail} />
          </div>
        </TabsContent>
        <TabsContent value="team" className="mt-3">
          <TeamTab detail={detail} />
        </TabsContent>
        <TabsContent value="retro" className="mt-3">
          <RetrospectiveTab detail={detail} onUpdate={handleUpdate} />
        </TabsContent>
        <TabsContent value="notes" className="mt-3">
          <NotesTab detail={detail} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

// ============================================================
// Top-level SprintsView
// ============================================================

export function SprintsView() {
  const selectedSprintId = useUI((s) => s.selectedSprintId);

  return selectedSprintId ? (
    <SprintDetail id={selectedSprintId} />
  ) : (
    <SprintsList />
  );
}

export default SprintsView;
