"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Mail,
  Clock,
  CalendarDays,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  Users,
  Activity,
  ListChecks,
  StickyNote,
  History as HistoryIcon,
  LayoutDashboard,
  CircleDashed,
  TrendingUp,
} from "lucide-react";
import {
  useDashboard,
  useEmployeeDetail,
  useUpdateEmployee,
  useDeleteEmployee,
  useCreateNote,
} from "@/lib/queries";
import { useUI } from "@/stores/ui";
import { TEAMS, EMPLOYEE_COLOR_OPTIONS } from "@/lib/const";
import {
  employeeColor,
  STATUS_META,
  MOOD_META,
  type EmployeeRaw,
  type TaskRaw,
  type SprintRaw,
  type DailyUpdateRaw,
  type NoteRaw,
  type TaskStatus,
} from "@/lib/types";
import {
  EmployeeAvatar,
  StatusBadge,
  PriorityBadge,
  ProgressRing,
  MoodPill,
} from "@/components/sprint/shared";
import { SimpleBar, Heatmap } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fmtDate } from "@/lib/sprint";
import { cn } from "@/lib/utils";

// ROLES is not exported from @/lib/const — define locally.
const ROLES = [
  "Engineering Manager",
  "Staff Engineer",
  "Senior Engineer",
  "Engineer",
  "Tech Lead",
  "Product Designer",
  "QA Engineer",
  "Data Analyst",
  "Product Manager",
];

type TaskWithSprint = TaskRaw & { sprint: SprintRaw | null };

interface EmployeeDetailData {
  employee: EmployeeRaw;
  manager: EmployeeRaw | null;
  reports: EmployeeRaw[];
  tasks: TaskWithSprint[];
  currentTasks: TaskWithSprint[];
  dailyUpdates: (DailyUpdateRaw & {
    task: TaskRaw | null;
    sprint: SprintRaw | null;
  })[];
  notes: NoteRaw[];
  heatmap: { date: string; count: number; hours: number }[];
  performance: {
    sprintId: string;
    sprint: string;
    number: number;
    taskCount: number;
    estimate: number;
    completed: number;
    completionPct: number;
  }[];
  currentWorkload: {
    taskCount: number;
    estimate: number;
    completed: number;
    capacity: number;
    utilization: number;
  };
}

function utilizationColor(u: number): string {
  if (u > 100) return "text-red-400";
  if (u >= 85) return "text-amber-400";
  return "text-emerald-400";
}

function utilizationBarColor(u: number): string {
  if (u > 100) return "bg-red-500";
  if (u >= 85) return "bg-amber-500";
  return "bg-emerald-500";
}

function progressColor(p: number): string {
  if (p >= 100) return "bg-emerald-500";
  if (p >= 60) return "bg-sky-500";
  if (p >= 30) return "bg-amber-500";
  return "bg-red-500";
}

// ============================================================
// Team Grid (default state)
// ============================================================
function Stat({
  label,
  value,
  dot,
}: {
  label: string;
  value: string | number;
  dot?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />}
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
      <span>{label}</span>
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-muted/40 px-2 py-1.5 text-center">
      <p className="text-sm font-semibold tabular-nums text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
        {label}
      </p>
    </div>
  );
}

function TeamGrid() {
  const { data, isLoading } = useDashboard();
  const setSelectedEmployeeId = useUI((s) => s.setSelectedEmployeeId);
  const setQuickAddEmployeeOpen = useUI((s) => s.setQuickAddEmployeeOpen);
  const [team, setTeam] = React.useState<string>("all");

  const workloadById = React.useMemo(() => {
    const m: Record<
      string,
      {
        taskCount: number;
        estimate: number;
        completed: number;
        capacity: number;
        utilization: number;
      }
    > = {};
    for (const w of data?.workload ?? []) {
      m[w.employee.id] = {
        taskCount: w.taskCount,
        estimate: w.estimate,
        completed: w.completed,
        capacity: w.capacity,
        utilization: w.utilization,
      };
    }
    return m;
  }, [data]);

  const employees = data?.employees ?? [];
  const filtered = React.useMemo(() => {
    return team === "all" ? employees : employees.filter((e) => e.team === team);
  }, [employees, team]);

  const stats = React.useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.status === "active").length;
    const utils = data?.workload ?? [];
    const avg =
      utils.length > 0
        ? Math.round(utils.reduce((s, w) => s + w.utilization, 0) / utils.length)
        : 0;
    return { total, active, avg };
  }, [employees, data]);

  const tabs = [{ value: "all", label: "All" }, ...TEAMS.map((t) => ({ value: t, label: t }))];

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
            <Users className="h-4 w-4 text-sprint-primary" />
            <span className="truncate text-[13px] font-semibold text-foreground">Team</span>
          </div>
          {/* Team tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card/40 p-1">
            {tabs.map((t) => (
              <button
                key={t.value}
                onClick={() => setTeam(t.value)}
                className={cn(
                  "relative rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  team === t.value
                    ? "text-sprint-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {team === t.value && (
                  <motion.span
                    layoutId="team-tab"
                    className="absolute inset-0 rounded-md bg-sprint-primary"
                    transition={{ type: "spring", duration: 0.3 }}
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Stats strip */}
          <div className="hidden items-center gap-3 text-[11px] text-muted-foreground md:flex">
            <Stat label="Members" value={stats.total} />
            <span className="text-muted-foreground/30">·</span>
            <Stat label="Active" value={stats.active} dot="bg-emerald-400" />
            <span className="text-muted-foreground/30">·</span>
            <Stat
              label="Avg util"
              value={`${stats.avg}%`}
              dot={utilizationBarColor(stats.avg)}
            />
          </div>
          <Button
            size="sm"
            onClick={() => setQuickAddEmployeeOpen(true)}
            className="bg-sprint-primary text-sprint-primary-foreground hover:bg-sprint-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add member
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card/40 p-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))
          : null}
      </div>

      {!isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((e) => {
              const w = workloadById[e.id];
              const util = w?.utilization ?? 0;
              return (
                <motion.button
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedEmployeeId(e.id)}
                  className={cn(
                    "group relative flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-4 text-left",
                    "transition-all hover:-translate-y-0.5 hover:border-sprint-primary/40 hover:bg-card/60 hover:shadow-lg hover:shadow-sprint-primary/5"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <EmployeeAvatar employee={e} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {e.name}
                        </p>
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            e.status === "active"
                              ? "bg-emerald-400"
                              : "bg-muted-foreground/40"
                          )}
                          title={e.status === "active" ? "Active" : "Inactive"}
                        />
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground">{e.role}</p>
                      <span
                        className={cn(
                          "mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                          employeeColor(e.color).bg,
                          employeeColor(e.color).text,
                          employeeColor(e.color).ring
                        )}
                      >
                        {e.team}
                      </span>
                    </div>
                    {/* Utilization ring */}
                    <div className="flex flex-col items-center">
                      <ProgressRing
                        value={Math.min(100, util)}
                        size={44}
                        stroke={4}
                        className={utilizationColor(util)}
                      />
                      <span
                        className={cn(
                          "mt-0.5 text-[9px] font-semibold tabular-nums",
                          utilizationColor(util)
                        )}
                      >
                        {util}%
                      </span>
                    </div>
                  </div>

                  {/* Mini stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <MiniStat label="Tasks" value={w?.taskCount ?? 0} />
                    <MiniStat label="Estimate" value={`${w?.estimate ?? 0}pt`} />
                    <MiniStat label="Done" value={`${w?.completed ?? 0}pt`} />
                  </div>

                  {/* Capacity bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Capacity</span>
                      <span className="tabular-nums">
                        {w?.estimate ?? 0}/{w?.capacity ?? 0}pt
                      </span>
                    </div>
                    <div className="relative h-1.5 overflow-hidden rounded-full bg-muted/60">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          utilizationBarColor(util)
                        )}
                        style={{ width: `${Math.min(100, util)}%` }}
                      />
                    </div>
                  </div>

                  {/* Skills */}
                  {e.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {e.skills.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          {s}
                        </span>
                      ))}
                      {e.skills.length > 3 && (
                        <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          +{e.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      ) : null}

      {!isLoading && filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <CircleDashed className="h-6 w-6 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">
            No members {team === "all" ? "" : `in ${team}`}
          </p>
          <p className="text-xs text-muted-foreground">
            Try a different team or add a new member.
          </p>
        </div>
      ) : null}
    </motion.div>
  );
}

// ============================================================
// Edit Dialog
// ============================================================
function EditDialog({
  employee,
  open,
  onOpenChange,
}: {
  employee: EmployeeRaw;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const update = useUpdateEmployee();
  const [name, setName] = React.useState(employee.name);
  const [role, setRole] = React.useState(employee.role);
  const [team, setTeam] = React.useState(employee.team);
  const [color, setColor] = React.useState(employee.color);
  const [capacity, setCapacity] = React.useState(String(employee.capacity));

  React.useEffect(() => {
    if (open) {
      setName(employee.name);
      setRole(employee.role);
      setTeam(employee.team);
      setColor(employee.color);
      setCapacity(String(employee.capacity));
    }
  }, [open, employee]);

  const submit = () => {
    update.mutate(
      {
        id: employee.id,
        body: {
          name: name.trim(),
          role,
          team,
          color,
          capacity: Number(capacity) || employee.capacity,
        },
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 border-border bg-popover p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle>Edit member</DialogTitle>
          <DialogDescription>Update profile details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br text-sm font-semibold text-white",
                employeeColor(color).gradient
              )}
            >
              {name
                ? name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                : "?"}
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="edit-name">Full name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Team</Label>
              <Select value={team} onValueChange={setTeam}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAMS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Capacity (h/wk)</Label>
            <Input
              type="number"
              min={0}
              max={60}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {EMPLOYEE_COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-8 w-8 rounded-full bg-gradient-to-br ring-2 ring-offset-2 ring-offset-background transition",
                    employeeColor(c).gradient,
                    color === c ? "scale-110 ring-white" : "ring-transparent"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="border-t border-border px-5 py-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!name.trim() || update.isPending}
            className="bg-sprint-primary text-sprint-primary-foreground hover:bg-sprint-primary/90"
          >
            {update.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Overview Tab
// ============================================================
function OverviewTab({
  employee,
  currentWorkload,
  performance,
}: {
  employee: EmployeeRaw;
  currentWorkload: EmployeeDetailData["currentWorkload"];
  performance: EmployeeDetailData["performance"];
}) {
  const completionPct =
    currentWorkload.estimate > 0
      ? Math.round((currentWorkload.completed / currentWorkload.estimate) * 100)
      : 0;
  const util = currentWorkload.utilization;
  const perfData = performance.map((p) => ({
    name: `S${p.number}`,
    value: p.completed,
    color: "var(--chart-1)" as string,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Workload + Performance */}
      <div className="space-y-4 lg:col-span-2">
        <div className="rounded-xl border border-border bg-card/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Current sprint workload
              </h3>
              <p className="text-[11px] text-muted-foreground">Capacity vs estimate</p>
            </div>
            <ProgressRing value={completionPct} size={56} stroke={5} />
          </div>

          <div className="mt-4 grid grid-cols-4 gap-3">
            <MiniStat label="Tasks" value={currentWorkload.taskCount} />
            <MiniStat label="Estimate" value={`${currentWorkload.estimate}pt`} />
            <MiniStat label="Done" value={`${currentWorkload.completed}pt`} />
            <MiniStat label="Capacity" value={`${currentWorkload.capacity}pt`} />
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Capacity usage</span>
              <span className="tabular-nums">
                {currentWorkload.estimate}/{currentWorkload.capacity}pt ({util}%)
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-muted/60">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  utilizationBarColor(util)
                )}
                style={{ width: `${Math.min(100, util)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Performance chart */}
        <div className="rounded-xl border border-border bg-card/40 p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-sprint-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Performance per sprint
            </h3>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Completed story points by sprint
          </p>
          {perfData.length > 0 ? (
            <div className="mt-3">
              <SimpleBar
                data={perfData}
                horizontal
                height={Math.max(160, perfData.length * 36)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-center">
              <CircleDashed className="h-5 w-5 text-muted-foreground/40" />
              <p className="text-[11px] text-muted-foreground">No sprint history yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Side: utilization + skills */}
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card/40 p-5">
          <h3 className="text-sm font-semibold text-foreground">Utilization</h3>
          <div className="mt-3 flex items-center justify-center">
            <ProgressRing
              value={Math.min(100, util)}
              size={120}
              stroke={10}
              className={utilizationColor(util)}
            />
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {util}% of weekly capacity
          </p>
          <div className="mt-3 flex justify-center gap-3 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              &lt;85%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              85–100%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              &gt;100%
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/40 p-5">
          <h3 className="text-sm font-semibold text-foreground">Skills</h3>
          {employee.skills.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {employee.skills.map((s) => (
                <span
                  key={s}
                  className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-foreground/80"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[11px] text-muted-foreground">No skills listed</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Tasks Tab
// ============================================================
function TasksTab({ tasks }: { tasks: TaskWithSprint[] }) {
  const [filter, setFilter] = React.useState<string>("all");

  const statusOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) set.add(t.status);
    return Array.from(set);
  }, [tasks]);

  const visible = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
        <ListChecks className="h-6 w-6 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">No tasks in current sprint</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-muted-foreground">Filter:</span>
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-md px-2 py-0.5 text-[11px] font-medium transition",
            filter === "all"
              ? "bg-sprint-primary text-sprint-primary-foreground"
              : "bg-muted/60 text-muted-foreground hover:text-foreground"
          )}
        >
          All ({tasks.length})
        </button>
        {statusOptions.map((s) => {
          const meta = STATUS_META[s as TaskStatus];
          const count = tasks.filter((t) => t.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium transition",
                filter === s
                  ? "bg-sprint-primary text-sprint-primary-foreground"
                  : cn("bg-muted/60 text-muted-foreground hover:text-foreground", meta?.text)
              )}
            >
              <span
                className={cn("h-1.5 w-1.5 rounded-full bg-current opacity-70", meta?.text)}
              />
              {meta?.label ?? s}
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {visible.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-border bg-card/40 p-3 transition-colors hover:border-sprint-primary/30"
          >
            <div className="flex items-start gap-2">
              <p className="line-clamp-2 flex-1 text-[13px] font-medium text-foreground">
                {t.title}
              </p>
              <PriorityBadge priority={t.priority} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={t.status} />
              <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                {t.estimate}pt
              </span>
              {t.project && (
                <span className="truncate text-[10px] uppercase tracking-wide text-muted-foreground/60">
                  {t.project}
                </span>
              )}
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted/60">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    progressColor(t.progress)
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, t.progress))}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                {t.progress}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Activity Tab
// ============================================================
function ActivityTab({
  heatmap,
  dailyUpdates,
}: {
  heatmap: { date: string; count: number; hours: number }[];
  dailyUpdates: EmployeeDetailData["dailyUpdates"];
}) {
  const totalUpdates = heatmap.reduce((s, h) => s + h.count, 0);
  const totalHours = heatmap.reduce((s, h) => s + h.hours, 0);

  const moodEntries = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const u of dailyUpdates) {
      counts[u.mood] = (counts[u.mood] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [dailyUpdates]);
  const moodTotal = dailyUpdates.length || 1;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {/* Heatmap */}
        <div className="rounded-xl border border-border bg-card/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Activity heatmap</h3>
              <p className="text-[11px] text-muted-foreground">Last 13 weeks</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Activity className="h-3 w-3 text-sprint-primary" />
                <span className="font-semibold tabular-nums text-foreground">
                  {totalUpdates}
                </span>{" "}
                updates
              </span>
              <span className="text-muted-foreground/30">·</span>
              <span>
                <span className="font-semibold tabular-nums text-foreground">
                  {totalHours.toFixed(1)}h
                </span>{" "}
                logged
              </span>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto scrollbar-thin">
            <Heatmap data={heatmap} weeks={13} />
          </div>
        </div>

        {/* Recent updates */}
        <div className="rounded-xl border border-border bg-card/40 p-5">
          <h3 className="text-sm font-semibold text-foreground">Recent daily updates</h3>
          <div className="mt-3 max-h-[480px] space-y-2.5 overflow-y-auto scrollbar-thin pr-1">
            {dailyUpdates.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-center">
                <CircleDashed className="h-5 w-5 text-muted-foreground/40" />
                <p className="text-[11px] text-muted-foreground">No daily updates</p>
              </div>
            ) : (
              dailyUpdates.map((u) => (
                <div
                  key={u.id}
                  className="rounded-lg border border-border/60 bg-muted/20 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-foreground">
                        {fmtDate(u.date)}
                      </span>
                      <MoodPill mood={u.mood} />
                      <span className="text-[10px] text-muted-foreground/70">
                        {u.hoursWorked}h
                      </span>
                    </div>
                    {u.task && (
                      <span
                        className="truncate text-[10px] text-muted-foreground"
                        title={u.task.title}
                      >
                        {u.task.title}
                      </span>
                    )}
                  </div>
                  {u.todayProgress ? (
                    <p className="mt-1.5 text-[12px] text-foreground/80">{u.todayProgress}</p>
                  ) : null}
                  {u.blockers ? (
                    <p className="mt-1 text-[11px] text-red-300/90">
                      <AlertTriangle className="mr-1 inline h-3 w-3" />
                      {u.blockers}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Side: mood distribution */}
      <div className="rounded-xl border border-border bg-card/40 p-5">
        <h3 className="text-sm font-semibold text-foreground">Mood distribution</h3>
        {moodEntries.length === 0 ? (
          <p className="mt-3 text-[11px] text-muted-foreground">No mood data</p>
        ) : (
          <div className="mt-3 space-y-2.5">
            {moodEntries.map(([mood, count]) => {
              const meta = MOOD_META[mood as keyof typeof MOOD_META];
              const pct = Math.round((count / moodTotal) * 100);
              return (
                <div key={mood} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={cn("inline-flex items-center gap-1.5", meta.color)}>
                      <span>{meta.emoji}</span>
                      {meta.label}
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
                    <div
                      className="h-full rounded-full bg-sprint-primary/70"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// History Tab
// ============================================================
function HistoryTab({ performance }: { performance: EmployeeDetailData["performance"] }) {
  if (performance.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
        <HistoryIcon className="h-6 w-6 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">No sprint history yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/40">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-[12px]">
          <thead className="bg-card/60">
            <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Sprint</th>
              <th className="px-4 py-2.5 text-right font-medium">Tasks</th>
              <th className="px-4 py-2.5 text-right font-medium">Estimate</th>
              <th className="px-4 py-2.5 text-right font-medium">Completed</th>
              <th className="px-4 py-2.5 text-right font-medium">Completion</th>
            </tr>
          </thead>
          <tbody>
            {performance.map((p) => (
              <tr
                key={p.sprintId}
                className="border-b border-border/60 last:border-0 hover:bg-sprint-primary/5"
              >
                <td className="px-4 py-2.5 font-medium text-foreground">{p.sprint}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                  {p.taskCount}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                  {p.estimate}pt
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-foreground">
                  {p.completed}pt
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted/60">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          p.completionPct >= 80
                            ? "bg-emerald-500"
                            : p.completionPct >= 50
                              ? "bg-amber-500"
                              : "bg-red-500"
                        )}
                        style={{ width: `${Math.min(100, p.completionPct)}%` }}
                      />
                    </div>
                    <span className="w-9 text-right text-[11px] font-semibold tabular-nums text-foreground">
                      {p.completionPct}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// Notes Tab
// ============================================================
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

function NotesTab({
  employeeId,
  notes,
}: {
  employeeId: string;
  notes: NoteRaw[];
}) {
  const create = useCreateNote();
  const [content, setContent] = React.useState("");
  const [type, setType] = React.useState<NoteRaw["type"]>("general");

  const submit = () => {
    if (!content.trim()) return;
    create.mutate(
      { content: content.trim(), type, employeeId },
      {
        onSuccess: () => {
          setContent("");
          setType("general");
        },
      }
    );
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Notes list */}
      <div className="space-y-2.5 lg:col-span-2">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
            <StickyNote className="h-5 w-5 text-muted-foreground/40" />
            <p className="text-[12px] text-muted-foreground">No notes yet</p>
          </div>
        ) : (
          notes.map((n) => {
            const meta = NOTE_TYPE_META[n.type];
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
                <p className="mt-2 whitespace-pre-wrap text-[12px] text-foreground/85">
                  {n.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Add note */}
      <div className="rounded-xl border border-border bg-card/40 p-4">
        <h3 className="text-sm font-semibold text-foreground">Add note</h3>
        <div className="mt-3 space-y-2.5">
          <div className="space-y-1.5">
            <Label className="text-[11px]">Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as NoteRaw["type"])}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NOTE_TYPE_META).map(([v, m]) => (
                  <SelectItem key={v} value={v}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px]">Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a note…"
              className="min-h-24 text-[12px]"
            />
          </div>
          <Button
            onClick={submit}
            disabled={!content.trim() || create.isPending}
            size="sm"
            className="w-full bg-sprint-primary text-sprint-primary-foreground hover:bg-sprint-primary/90"
          >
            {create.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Add note
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Employee Detail
// ============================================================
function TeamDetail({ id }: { id: string }) {
  const setSelectedEmployeeId = useUI((s) => s.setSelectedEmployeeId);
  const query = useEmployeeDetail(id);
  const update = useUpdateEmployee();
  const remove = useDeleteEmployee();
  const [editOpen, setEditOpen] = React.useState(false);
  const [tab, setTab] = React.useState("overview");

  const detail = query.data as EmployeeDetailData | undefined;

  if (query.isLoading || !detail) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedEmployeeId(null)}
          className="w-fit text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to team
        </Button>
        <div className="rounded-xl border border-border bg-card/40 p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedEmployeeId(null)}
          className="w-fit text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to team
        </Button>
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <AlertTriangle className="h-6 w-6 text-amber-400" />
          <p className="text-sm font-medium text-foreground">Failed to load employee</p>
          <Button size="sm" variant="outline" onClick={() => query.refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const {
    employee,
    manager,
    currentWorkload,
    performance,
    currentTasks,
    dailyUpdates,
    notes,
    heatmap,
  } = detail;
  const isActive = employee.status === "active";

  const handleRemove = () => {
    if (typeof window !== "undefined") {
      const ok = window.confirm(`Remove ${employee.name}? This action cannot be undone.`);
      if (!ok) return;
    }
    remove.mutate(employee.id, {
      onSuccess: () => setSelectedEmployeeId(null),
    });
  };

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
        onClick={() => setSelectedEmployeeId(null)}
        className="w-fit text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to team
      </Button>

      {/* Header card */}
      <div className="rounded-xl border border-border bg-card/40 p-5">
        <div className="flex flex-wrap items-start gap-5">
          <EmployeeAvatar employee={employee} size="lg" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">{employee.name}</h2>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset",
                  employeeColor(employee.color).bg,
                  employeeColor(employee.color).text,
                  employeeColor(employee.color).ring
                )}
              >
                {employee.team}
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground">{employee.role}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                {employee.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {employee.timezone}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3" />
                Joined {fmtDate(employee.joinedAt)}
              </span>
              {manager ? (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3 w-3" />
                  Manager:{" "}
                  <span className="text-foreground/80">{manager.name}</span>
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                {isActive ? "Active" : "Inactive"}
              </span>
              <Switch
                checked={isActive}
                onCheckedChange={(v) =>
                  update.mutate({
                    id: employee.id,
                    body: { status: v ? "active" : "inactive" },
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              {isActive ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    update.mutate({
                      id: employee.id,
                      body: { status: "inactive" },
                    })
                  }
                >
                  Deactivate
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                onClick={handleRemove}
                disabled={remove.isPending}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                {remove.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Remove
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1">
        <TabsList>
          <TabsTrigger value="overview">
            <LayoutDashboard className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ListChecks className="h-3.5 w-3.5" /> Tasks
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-3.5 w-3.5" /> Activity
          </TabsTrigger>
          <TabsTrigger value="history">
            <HistoryIcon className="h-3.5 w-3.5" /> History
          </TabsTrigger>
          <TabsTrigger value="notes">
            <StickyNote className="h-3.5 w-3.5" /> Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-3">
          <OverviewTab
            employee={employee}
            currentWorkload={currentWorkload}
            performance={performance}
          />
        </TabsContent>

        <TabsContent value="tasks" className="mt-3">
          <TasksTab tasks={currentTasks} />
        </TabsContent>

        <TabsContent value="activity" className="mt-3">
          <ActivityTab heatmap={heatmap} dailyUpdates={dailyUpdates} />
        </TabsContent>

        <TabsContent value="history" className="mt-3">
          <HistoryTab performance={performance} />
        </TabsContent>

        <TabsContent value="notes" className="mt-3">
          <NotesTab employeeId={employee.id} notes={notes} />
        </TabsContent>
      </Tabs>

      <EditDialog
        employee={employee}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </motion.div>
  );
}

// ============================================================
// Top-level TeamView
// ============================================================
export function TeamView() {
  const selectedEmployeeId = useUI((s) => s.selectedEmployeeId);

  return selectedEmployeeId ? (
    <TeamDetail id={selectedEmployeeId} />
  ) : (
    <TeamGrid />
  );
}

export default TeamView;
