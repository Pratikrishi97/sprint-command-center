"use client";

import { useDashboard } from "@/lib/queries";
import { useUI } from "@/stores/ui";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Ban,
  AlertTriangle,
  Flame,
  Clock,
  TrendingUp,
  Users,
  Target,
  Activity,
  ArrowRight,
  Plus,
  CalendarCheck,
  Sparkles,
  Zap,
  Gauge,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EmployeeAvatar,
  StatusBadge,
  PriorityBadge,
  RiskBadge,
  MoodPill,
  ProgressRing,
} from "../shared";
import {
  BurndownChart,
  VelocityChart,
  WorkloadChart,
  StatusDonut,
  SimpleBar,
  CompletionGauge,
  Heatmap,
} from "@/components/charts";
import { format, differenceInCalendarDays } from "date-fns";
import { sprintTimeline, type SprintInfo } from "@/lib/sprint";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { TaskStatus } from "@/lib/types";

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
  delay = 0,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "default" | "emerald" | "amber" | "red" | "sky";
  delay?: number;
}) {
  const tones: Record<string, string> = {
    default: "text-muted-foreground bg-muted/40",
    emerald: "text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    red: "text-red-400 bg-red-500/10",
    sky: "text-sky-400 bg-sky-500/10",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="rounded-xl border border-border bg-card/60 p-4 transition hover:border-border/80 hover:bg-card"
    >
      <div className="flex items-start justify-between">
        <div className={cn("grid h-9 w-9 place-items-center rounded-lg", tones[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight tabular-nums">{value}</div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground/70">{sub}</div>}
    </motion.div>
  );
}

function Card({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className,
  delay = 0,
}: {
  title: string;
  subtitle?: string;
  icon?: typeof Activity;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn("flex flex-col rounded-xl border border-border bg-card/40 p-4", className)}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-sprint-primary/10 text-sprint-primary">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{title}</div>
            {subtitle && <div className="truncate text-[11px] text-muted-foreground">{subtitle}</div>}
          </div>
        </div>
        {action}
      </div>
      <div className="flex-1">{children}</div>
    </motion.div>
  );
}

export function DashboardView() {
  const { data, isLoading } = useDashboard();
  const { setView, setSelectedTaskId, setQuickAddTaskOpen, setDailyUpdateOpen, setSelectedEmployeeId } = useUI();

  if (isLoading || !data) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const { sprint, sprintInfo, metrics, burndown, velocity, workload, statusDist, riskDist, heatmap, todaysUpdates, recentUpdates, notes, upcoming, overdue } = data;
  const info = sprintInfo as SprintInfo;
  const timeline = sprintTimeline(new Date(sprint.startDate), new Date(sprint.endDate), new Date());

  const lastVelocity = velocity.filter((v) => v.status === "completed").slice(-6);
  const avgVelocity = lastVelocity.length
    ? Math.round(lastVelocity.reduce((s, v) => s + v.completed, 0) / lastVelocity.length)
    : 0;

  const topWorkload = [...workload].sort((a, b) => b.estimate - a.estimate).slice(0, 8);

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Hero sprint header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card/80 via-card/60 to-card/40 p-5"
      >
        <div className="absolute inset-0 bg-radial-glow" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" /> Active Sprint
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Week {info.currentWeek} of 2
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{sprint.name}</h2>
            <p className="text-sm text-muted-foreground">
              {format(new Date(sprint.startDate), "MMM d")} → {format(new Date(sprint.endDate), "MMM d, yyyy")} ·{" "}
              <span className="text-foreground">{info.daysRemaining} days remaining</span>
            </p>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="text-3xl font-bold tabular-nums text-sprint-primary">{metrics.overallCompletion}%</div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Complete</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold tabular-nums">{info.workingDaysElapsed}/{info.totalWorkingDays}</div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Work days</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold tabular-nums">{metrics.totalTasks}</div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Tasks</div>
            </div>
          </div>
        </div>

        {/* Sprint timeline */}
        <div className="relative mt-5">
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
            {timeline.map((d) => (
              <div
                key={d.dayIndex}
                className={cn(
                  "flex min-w-[44px] flex-1 flex-col items-center rounded-lg border px-1 py-2 text-center transition",
                  d.isToday && "border-sprint-primary bg-sprint-primary/10",
                  !d.isToday && d.isWeekend && "border-border/50 bg-muted/20 opacity-60",
                  !d.isToday && !d.isWeekend && "border-border bg-card/40",
                  d.isPast && !d.isToday && !d.isWeekend && "opacity-70"
                )}
              >
                <span className="text-[10px] uppercase text-muted-foreground">{format(d.date, "EEEEE")}</span>
                <span className={cn("text-sm font-semibold", d.isToday && "text-sprint-primary")}>{d.shortLabel}</span>
                <span className="mt-0.5 h-1 w-1 rounded-full bg-current opacity-0">
                  {d.isToday && <span className="block h-1 w-1 rounded-full bg-sprint-primary opacity-100" />}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi icon={CheckCircle2} label="Completed" value={metrics.completedTasks} sub={`${metrics.totalTasks} total`} tone="emerald" delay={0.02} />
        <Kpi icon={Activity} label="In Progress" value={metrics.inProgressTasks} tone="sky" delay={0.04} />
        <Kpi icon={Ban} label="Blocked" value={metrics.blockedTasks} tone="red" delay={0.06} />
        <Kpi icon={Clock} label="Delayed" value={metrics.delayedTasks} tone="amber" delay={0.08} />
        <Kpi icon={Flame} label="High Priority" value={metrics.highPriorityTasks} tone="amber" delay={0.1} />
        <Kpi icon={AlertTriangle} label="Overdue" value={metrics.overdueTasks} tone="red" delay={0.12} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Burndown */}
        <Card title="Sprint Burndown" subtitle="Remaining vs ideal" icon={TrendingUp} className="lg:col-span-2" delay={0.14}
          action={<div className="text-[11px] text-muted-foreground"><span className="text-emerald-400">●</span> remaining · <span className="text-muted-foreground">— ideal</span></div>}
        >
          <BurndownChart data={burndown} height={260} />
        </Card>

        {/* Completion gauge + velocity */}
        <Card title="Completion" subtitle="Sprint progress" icon={Gauge} delay={0.16}>
          <div className="flex flex-col items-center justify-center gap-3 py-2">
            <CompletionGauge value={metrics.overallCompletion} size={150} />
            <div className="grid w-full grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-muted/40 p-2">
                <div className="text-sm font-bold text-emerald-400">{metrics.completedEstimate}</div>
                <div className="text-[10px] text-muted-foreground">pts done</div>
              </div>
              <div className="rounded-lg bg-muted/40 p-2">
                <div className="text-sm font-bold">{metrics.totalEstimate - metrics.completedEstimate}</div>
                <div className="text-[10px] text-muted-foreground">pts left</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Velocity */}
        <Card title="Velocity" subtitle="Completed pts per sprint" icon={Zap} className="lg:col-span-2" delay={0.18}
          action={<span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">avg {avgVelocity} pts</span>}
        >
          <VelocityChart data={velocity.slice(-8)} height={240} />
        </Card>

        {/* Status donut */}
        <Card title="Status Mix" subtitle="Current sprint tasks" icon={ListChecks} delay={0.2}>
          <StatusDonut data={statusDist} height={200} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(statusDist).filter(([, v]) => v > 0).slice(0, 6).map(([s, v]) => (
              <span key={s} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className={cn("h-2 w-2 rounded-full", STATUS_COLOR[s as TaskStatus])} />
                {v}
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Today's standup */}
        <Card
          title="Today's Standup"
          subtitle={`${todaysUpdates.length} updates`}
          icon={CalendarCheck}
          className="lg:col-span-2"
          delay={0.22}
          action={
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setDailyUpdateOpen(true)}>
              <Plus className="h-3 w-3" /> Log
            </Button>
          }
        >
          <div className="max-h-[340px] space-y-2 overflow-y-auto scrollbar-thin pr-1">
            {todaysUpdates.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-muted/40">
                  <CalendarCheck className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-sm font-medium">No standups logged today</div>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDailyUpdateOpen(true)}>
                  Log the first update
                </Button>
              </div>
            ) : (
              todaysUpdates.map((u, i) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.24 + i * 0.03 }}
                  className="rounded-lg border border-border bg-card/40 p-3 transition hover:border-border/80"
                >
                  <div className="flex items-start gap-3">
                    <button onClick={() => setSelectedEmployeeId(u.employeeId)}>
                      <EmployeeAvatar employee={u.employee!} size="md" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{u.employee?.name}</span>
                          <MoodPill mood={u.mood} />
                        </div>
                        <span className="text-[11px] text-muted-foreground">{u.hoursWorked}h</span>
                      </div>
                      {u.task && (
                        <button onClick={() => setSelectedTaskId(u.taskId)} className="mt-0.5 block truncate text-[11px] text-muted-foreground hover:text-sprint-primary">
                          {u.task.title}
                        </button>
                      )}
                      {u.todayProgress && <p className="mt-1.5 text-xs leading-relaxed text-foreground/90">{u.todayProgress}</p>}
                      {u.blockers && (
                        <div className="mt-1.5 flex items-start gap-1.5 rounded-md bg-red-500/10 px-2 py-1 text-[11px] text-red-300">
                          <Ban className="mt-0.5 h-3 w-3 shrink-0" /> {u.blockers}
                        </div>
                      )}
                      {u.tomorrowPlan && (
                        <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                          <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-sprint-primary" /> {u.tomorrowPlan}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0">
                      <ProgressRing value={u.percentage} size={36} stroke={3} />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </Card>

        {/* Workload */}
        <Card title="Team Workload" subtitle="Estimate vs capacity" icon={Users} delay={0.24}
          action={<Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setView("team")}>View all</Button>}
        >
          <WorkloadChart data={topWorkload} height={300} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* At risk / blocked */}
        <Card title="Needs Attention" subtitle="Blocked · delayed · overdue" icon={AlertTriangle} className="lg:col-span-2" delay={0.26}
          action={<Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setView("tasks")}>All tasks</Button>}
        >
          <div className="max-h-[320px] space-y-1.5 overflow-y-auto scrollbar-thin pr-1">
            {[...overdue, ...data.sprintTasks.filter((t) => t.status === "blocked" || t.status === "delayed" || t.status === "needs_attention")]
              .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
              .slice(0, 10)
              .map((t, i) => (
                <motion.button
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.28 + i * 0.03 }}
                  onClick={() => { setSelectedTaskId(t.id); setView("tasks"); }}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-card/30 p-2.5 text-left transition hover:border-sprint-primary/40 hover:bg-accent"
                >
                  <div className={cn("h-9 w-1 shrink-0 rounded-full",
                    t.status === "blocked" ? "bg-red-500" : t.status === "delayed" ? "bg-rose-500" : t.status === "needs_attention" ? "bg-pink-500" : "bg-amber-500")} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{t.title}</div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <StatusBadge status={t.status} />
                      <span className="text-[11px] text-muted-foreground">{t.project}</span>
                    </div>
                  </div>
                  {t.owner && <EmployeeAvatar employee={t.owner} size="sm" />}
                </motion.button>
              ))}
            {overdue.length === 0 && data.sprintTasks.filter((t) => t.status === "blocked" || t.status === "delayed").length === 0 && (
              <div className="flex items-center gap-2 py-8 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Nothing blocked or delayed — ship it!
              </div>
            )}
          </div>
        </Card>

        {/* Risk + activity */}
        <div className="space-y-4">
          <Card title="Risk Distribution" subtitle="By risk level" icon={Target} delay={0.28}>
            <SimpleBar
              horizontal
              height={150}
              data={[
                { name: "Low", value: riskDist.low, color: "oklch(0.7 0.15 158)" },
                { name: "Medium", value: riskDist.medium, color: "oklch(0.75 0.15 80)" },
                { name: "High", value: riskDist.high, color: "oklch(0.7 0.16 40)" },
                { name: "Critical", value: riskDist.critical, color: "oklch(0.62 0.2 25)" },
              ]}
            />
          </Card>
          <Card title="Activity" subtitle="Last 5 weeks" icon={Activity} delay={0.3}>
            <Heatmap data={heatmap} weeks={5} />
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Upcoming deadlines */}
        <Card title="Upcoming Deadlines" subtitle="Next 7 days" icon={Clock} delay={0.32}
          action={<Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setView("calendar")}>Calendar</Button>}
        >
          <div className="space-y-1.5">
            {upcoming.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">No deadlines this week</div>
            ) : (
              upcoming.map((t, i) => {
                const days = differenceInCalendarDays(new Date(t.endDate), new Date());
                return (
                  <motion.button
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.34 + i * 0.03 }}
                    onClick={() => { setSelectedTaskId(t.id); setView("tasks"); }}
                    className="flex w-full items-center gap-3 rounded-lg border border-border bg-card/30 p-2.5 text-left transition hover:bg-accent"
                  >
                    <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg text-center",
                      days <= 1 ? "bg-red-500/10 text-red-400" : days <= 3 ? "bg-amber-500/10 text-amber-400" : "bg-muted/40 text-muted-foreground")}>
                      <div className="text-[10px] leading-none">{days <= 0 ? "Due" : `${days}d`}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{t.title}</div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <PriorityBadge priority={t.priority} />
                        <span className="text-[11px] text-muted-foreground">{format(new Date(t.endDate), "MMM d")}</span>
                      </div>
                    </div>
                    {t.owner && <EmployeeAvatar employee={t.owner} size="xs" ring={false} />}
                  </motion.button>
                );
              })
            )}
          </div>
        </Card>

        {/* Recent updates */}
        <Card title="Recent Updates" subtitle="Last few days" icon={Activity} className="lg:col-span-2" delay={0.34}>
          <div className="max-h-[280px] space-y-2 overflow-y-auto scrollbar-thin pr-1">
            {recentUpdates.slice(0, 12).map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.36 + i * 0.02 }}
                className="flex items-start gap-3 rounded-lg border border-border bg-card/30 p-2.5"
              >
                <button onClick={() => setSelectedEmployeeId(u.employeeId)}>
                  <EmployeeAvatar employee={u.employee!} size="sm" />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{u.employee?.name}</span>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(u.date), "MMM d")}</span>
                    <MoodPill mood={u.mood} />
                  </div>
                  {u.task && <div className="truncate text-[11px] text-muted-foreground">{u.task.title}</div>}
                  <p className="mt-0.5 line-clamp-2 text-xs text-foreground/80">{u.todayProgress || u.accomplishments}</p>
                </div>
                <div className="shrink-0">
                  <ProgressRing value={u.percentage} size={32} stroke={3} />
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* Notes */}
      {notes.length > 0 && (
        <Card title="Sprint Notes" subtitle="Blockers · risks · wins" icon={Sparkles} delay={0.38}>
          <div className="flex flex-wrap gap-2">
            {notes.slice(0, 8).map((n) => (
              <div
                key={n.id}
                className={cn(
                  "max-w-md rounded-lg border px-3 py-2 text-xs",
                  n.type === "blocker" && "border-red-500/30 bg-red-500/5",
                  n.type === "risk" && "border-amber-500/30 bg-amber-500/5",
                  n.type === "achievement" && "border-emerald-500/30 bg-emerald-500/5",
                  n.type === "retro" && "border-violet-500/30 bg-violet-500/5",
                  (n.type === "general" || !n.type) && "border-border bg-card/40"
                )}
              >
                <div className="mb-0.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{n.type}</span>
                  {n.employee && <span className="text-[10px] text-muted-foreground">· {n.employee.name}</span>}
                </div>
                <p className="text-foreground/90">{n.content}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  not_started: "bg-slate-500",
  planning: "bg-violet-500",
  in_progress: "bg-sky-500",
  development: "bg-cyan-500",
  review: "bg-amber-500",
  testing: "bg-teal-500",
  blocked: "bg-red-500",
  waiting: "bg-orange-500",
  completed: "bg-emerald-500",
  cancelled: "bg-zinc-500",
  delayed: "bg-rose-500",
  needs_attention: "bg-pink-500",
  ready_for_release: "bg-lime-500",
  released: "bg-green-500",
};
