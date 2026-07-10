"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Briefcase,
  CheckCircle2,
  CircleDashed,
  Flag,
  Gauge,
  LayoutDashboard,
  Layers,
  ListChecks,
  PieChart,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAnalytics, type AnalyticsData } from "@/lib/queries";
import {
  PRIORITY_META,
  RISK_META,
  STATUS_META,
  type Priority,
  type RiskLevel,
  type TaskStatus,
} from "@/lib/types";
import { PRIORITIES, RISKS } from "@/lib/const";
import { Heatmap, SimpleBar, StatusDonut, VelocityChart } from "@/components/charts";
import { cn } from "@/lib/utils";

// ============================================================
// Constants & helpers
// ============================================================

const IMPACTS: string[] = ["low", "medium", "high"];

const RISK_DOT: Record<RiskLevel, string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

const RISK_HEX: Record<RiskLevel, string> = {
  low: "oklch(0.72 0.17 158)",
  medium: "oklch(0.78 0.16 80)",
  high: "oklch(0.72 0.17 55)",
  critical: "oklch(0.66 0.21 25)",
};

const PRIORITY_HEX: Record<Priority, string> = {
  low: "oklch(0.6 0.01 264)",
  medium: "oklch(0.7 0.15 230)",
  high: "oklch(0.78 0.16 80)",
  critical: "oklch(0.66 0.21 25)",
};

function utilColor(u: number): { bar: string; text: string } {
  if (u > 100) return { bar: "bg-red-500", text: "text-red-400" };
  if (u >= 85) return { bar: "bg-amber-500", text: "text-amber-400" };
  return { bar: "bg-emerald-500", text: "text-emerald-400" };
}

function distToData(
  dist: Record<string, number>,
  limit = 8
): { name: string; value: number }[] {
  return Object.entries(dist)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

// ============================================================
// Layout primitives
// ============================================================

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  index,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.22 }}
      className={cn(
        "rounded-xl border border-border bg-card/60 p-5",
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
      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-muted-foreground/80">{hint}</p> : null}
    </motion.div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  index,
  action,
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
  index: number;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.22 }}
      className={cn("rounded-xl border border-border bg-card/40 p-5", className)}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-sprint-primary/10 ring-1 ring-inset ring-sprint-primary/20">
            <Icon className="h-3.5 w-3.5 text-sprint-primary" />
          </div>
          <div>
            {subtitle ? (
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          </div>
        </div>
        {action}
      </div>
      {children}
    </motion.div>
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
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-10 text-center">
      <Icon className="h-5 w-5 text-muted-foreground/40" />
      <p className="text-[12px] font-medium text-foreground">{title}</p>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[100px] animate-pulse rounded-xl border border-border bg-card/40"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-[300px] animate-pulse rounded-xl border border-border bg-card/40 lg:col-span-2" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[280px] animate-pulse rounded-xl border border-border bg-card/40"
          />
        ))}
        <div className="h-[280px] animate-pulse rounded-xl border border-border bg-card/40 lg:col-span-2" />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-red-500/30 bg-red-500/5 py-16 text-center">
      <AlertTriangle className="h-6 w-6 text-red-400" />
      <div>
        <p className="text-sm font-semibold text-foreground">Failed to load analytics</p>
        <p className="text-[11px] text-muted-foreground">
          Something went wrong fetching analytics data.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-md bg-sprint-primary px-3 py-1.5 text-[11px] font-medium text-sprint-primary-foreground transition hover:bg-sprint-primary/90"
      >
        <RefreshCw className="h-3 w-3" />
        Retry
      </button>
    </div>
  );
}

// ============================================================
// Header
// ============================================================

function Header() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sprint-primary/10 ring-1 ring-inset ring-sprint-primary/30">
          <LayoutDashboard className="h-4 w-4 text-sprint-primary" />
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Insights
          </p>
          <h1 className="text-lg font-semibold text-foreground">Analytics</h1>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-2.5 py-1 text-[11px] text-muted-foreground">
        <Activity className="h-3 w-3 text-sprint-primary" />
        Live · auto-refresh 60s
      </span>
    </motion.div>
  );
}

// ============================================================
// Risk matrix
// ============================================================

function RiskMatrix({
  risks,
  impacts,
  lookup,
  max,
}: {
  risks: { value: RiskLevel; label: string }[];
  impacts: string[];
  lookup: Map<string, number>;
  max: number;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[68px_repeat(3,1fr)] gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        <div />
        {impacts.map((imp) => (
          <div key={imp} className="text-center font-medium">
            {imp}
          </div>
        ))}
      </div>
      {risks.map((r) => {
        const meta = RISK_META[r.value];
        return (
          <div
            key={r.value}
            className="grid grid-cols-[68px_repeat(3,1fr)] gap-1.5"
          >
            <div className="flex items-center justify-end pr-1.5 text-[11px] font-medium text-muted-foreground">
              <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", RISK_DOT[r.value])} />
              {r.label}
            </div>
            {impacts.map((imp) => {
              const count = lookup.get(`${r.value}:${imp}`) ?? 0;
              const ratio = count === 0 ? 0 : Math.max(0.12, count / max);
              const isEmpty = count === 0;
              return (
                <div
                  key={imp}
                  className={cn(
                    "relative flex h-12 items-center justify-center rounded-md border text-sm font-semibold tabular-nums transition",
                    "hover:ring-1 hover:ring-sprint-primary/40",
                    isEmpty
                      ? "border-border text-muted-foreground/30"
                      : "border-border/60 text-foreground"
                  )}
                  style={{
                    backgroundColor: isEmpty
                      ? "oklch(1 0 0 / 2%)"
                      : `color-mix(in oklch, ${RISK_HEX[r.value]} ${ratio * 100}%, transparent)`,
                  }}
                  title={`${r.label} risk × ${imp} impact: ${count} task${
                    count === 1 ? "" : "s"
                  }`}
                >
                  {count > 0 ? count : "·"}
                </div>
              );
            })}
          </div>
        );
      })}
      <p className="pt-1 text-[10px] text-muted-foreground">
        Cell intensity scales with task count relative to the max (
        <span className="tabular-nums">{max}</span>) per risk level. Hover any cell for
        details.
      </p>
    </div>
  );
}

// ============================================================
// Utilization table
// ============================================================

function UtilizationTable({ rows }: { rows: AnalyticsData["utilization"] }) {
  const sorted = React.useMemo(
    () => [...rows].sort((a, b) => b.utilization - a.utilization),
    [rows]
  );
  return (
    <div className="space-y-2">
      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Under 85%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> 85–100%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" /> Over 100%
        </span>
      </div>
      {sorted.map((row, i) => {
        const c = utilColor(row.utilization);
        const barPct = Math.min(100, row.utilization);
        const overflow = Math.max(0, row.utilization - 100);
        return (
          <motion.div
            key={`${row.name}-${i}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02, duration: 0.2 }}
            className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-border bg-card/30 p-3 sm:grid-cols-[200px_1fr_72px] sm:gap-4"
          >
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-foreground">{row.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {row.team} · {row.taskCount} task{row.taskCount === 1 ? "" : "s"} ·{" "}
                <span className="tabular-nums">
                  {row.estimate}/{row.capacity} pts
                </span>
              </p>
            </div>
            <div className="col-span-2 order-3 sm:order-2 sm:col-span-1">
              <div className="flex items-center gap-2">
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted/40">
                  <div
                    className={cn("h-full rounded-full transition-all", c.bar)}
                    style={{ width: `${barPct}%` }}
                  />
                  {overflow > 0 && (
                    <div
                      className="absolute top-0 h-full bg-red-500/50"
                      style={{
                        left: "100%",
                        width: `${Math.min(40, overflow)}%`,
                        transform: "translateX(-100%)",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="text-right sm:order-3">
              <span className={cn("text-sm font-semibold tabular-nums", c.text)}>
                {row.utilization}%
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================================
// Sprint comparison table
// ============================================================

function SprintComparison({ rows }: { rows: AnalyticsData["recentSprints"] }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Sprint</th>
            <th className="px-3 py-2 text-right font-medium">Planned</th>
            <th className="px-3 py-2 text-right font-medium">Completed</th>
            <th className="px-3 py-2 text-right font-medium">Carryover</th>
            <th className="px-3 py-2 text-right font-medium">Completion</th>
            <th className="px-3 py-2 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const pct = r.planned > 0 ? Math.round((r.completed / r.planned) * 100) : 0;
            const barColor =
              pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
            return (
              <tr
                key={r.number}
                style={{ animationDelay: `${i * 30}ms` }}
                className="border-b border-border/50 transition-colors last:border-0 hover:bg-sprint-primary/5"
              >
                <td className="py-2.5 pr-3">
                  <span className="font-medium text-foreground">S{r.number}</span>
                  <span className="ml-1.5 text-muted-foreground">· {r.sprint}</span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
                  {r.planned}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-medium text-sprint-primary">
                  {r.completed}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                  {r.carryover}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted/40">
                      <div
                        className={cn("h-full rounded-full", barColor)}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <span className="w-9 text-right tabular-nums text-foreground">{pct}%</span>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ring-1 ring-inset",
                      r.status === "active" &&
                        "bg-sprint-primary/15 text-sprint-primary ring-sprint-primary/30",
                      r.status === "upcoming" &&
                        "bg-amber-500/15 text-amber-300 ring-amber-500/30",
                      r.status === "completed" &&
                        "bg-muted/40 text-muted-foreground ring-border"
                    )}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// Main view
// ============================================================

export function AnalyticsView() {
  const query = useAnalytics();
  const data = query.data;

  if (query.isLoading) {
    return (
      <div className="space-y-4 p-1">
        <Header />
        <LoadingSkeleton />
      </div>
    );
  }

  if (query.isError || !data) {
    return (
      <div className="space-y-4 p-1">
        <Header />
        <ErrorState onRetry={() => query.refetch()} />
      </div>
    );
  }

  // ---- KPIs ----
  const last6 = data.velocity.slice(-6);
  const avgVelocity =
    last6.length > 0
      ? Math.round(last6.reduce((s, v) => s + v.completed, 0) / last6.length)
      : 0;
  const avgCompletion =
    data.completionTrend.length > 0
      ? Math.round(
          data.completionTrend.reduce((s, v) => s + v.pct, 0) /
            data.completionTrend.length
        )
      : 0;
  const totalTasks = Object.values(data.statusDist).reduce((s, v) => s + v, 0);
  const avgUtilization =
    data.utilization.length > 0
      ? Math.round(
          data.utilization.reduce((s, v) => s + v.utilization, 0) /
            data.utilization.length
        )
      : 0;

  // ---- Derived chart data ----
  const velocityData = data.velocity.map((v) => ({
    sprint: `S${v.number}`,
    completed: v.completed,
    planned: v.planned,
    status: v.status,
  }));
  const completionData = data.completionTrend.map((c) => ({
    name: `S${c.number}`,
    value: c.pct,
  }));
  const categoryData = distToData(data.categoryDist, 8);
  const projectData = distToData(data.projectDist, 8);
  const priorityData = PRIORITIES.map((p) => ({
    name: p.label,
    value: data.priorityDist[p.value] ?? 0,
    color: PRIORITY_HEX[p.value],
  })).filter((d) => d.value > 0);

  // Risk matrix
  const maxRiskCount = Math.max(1, ...data.riskMatrix.map((r) => r.count));
  const riskLookup = new Map(
    data.riskMatrix.map((r) => [`${r.risk}:${r.impact}`, r.count])
  );

  return (
    <div className="space-y-4 p-1">
      <Header />

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          index={0}
          icon={Gauge}
          label="Avg Velocity"
          value={avgVelocity}
          hint="pts / sprint · last 6"
          accent
        />
        <KpiCard
          index={1}
          icon={CheckCircle2}
          label="Avg Completion"
          value={`${avgCompletion}%`}
          hint="across all sprints"
        />
        <KpiCard
          index={2}
          icon={ListChecks}
          label="Total Tasks"
          value={totalTasks}
          hint="across all sprints"
        />
        <KpiCard
          index={3}
          icon={Users}
          label="Team Utilization"
          value={`${avgUtilization}%`}
          hint="current sprint avg"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 1. Velocity Trend - full width */}
        <ChartCard
          index={4}
          title="Velocity Trend"
          subtitle="Completed vs planned story points per sprint"
          icon={TrendingUp}
          className="lg:col-span-2"
        >
          {velocityData.length > 0 ? (
            <VelocityChart data={velocityData} height={280} />
          ) : (
            <EmptyState
              icon={CircleDashed}
              title="No velocity data"
              hint="Velocity appears once sprints have tasks."
            />
          )}
        </ChartCard>

        {/* 2. Completion Rate */}
        <ChartCard
          index={5}
          title="Completion Rate"
          subtitle="% completion per sprint"
          icon={Gauge}
          action={
            <span className="rounded-full bg-sprint-primary/10 px-2 py-0.5 text-[10px] font-medium text-sprint-primary ring-1 ring-inset ring-sprint-primary/30">
              avg {avgCompletion}%
            </span>
          }
        >
          {completionData.length > 0 ? (
            <SimpleBar data={completionData} height={220} color="var(--chart-1)" />
          ) : (
            <EmptyState icon={CircleDashed} title="No completion data" />
          )}
        </ChartCard>

        {/* 3. Sprint Comparison - full width */}
        <ChartCard
          index={6}
          title="Sprint Comparison"
          subtitle="Last 6 sprints · completed / planned / carryover"
          icon={BarChart3}
          className="lg:col-span-2"
        >
          {data.recentSprints.length > 0 ? (
            <SprintComparison rows={data.recentSprints} />
          ) : (
            <EmptyState icon={CircleDashed} title="No recent sprints" />
          )}
        </ChartCard>

        {/* 4. By Category */}
        <ChartCard
          index={7}
          title="By Category"
          subtitle="Task distribution by category"
          icon={Layers}
        >
          {categoryData.length > 0 ? (
            <SimpleBar
              data={categoryData}
              height={220}
              horizontal
              color="var(--chart-1)"
            />
          ) : (
            <EmptyState icon={CircleDashed} title="No categories" />
          )}
        </ChartCard>

        {/* 5. By Project */}
        <ChartCard
          index={8}
          title="By Project"
          subtitle="Task distribution by project"
          icon={Briefcase}
        >
          {projectData.length > 0 ? (
            <SimpleBar
              data={projectData}
              height={220}
              horizontal
              color="var(--chart-2)"
            />
          ) : (
            <EmptyState icon={CircleDashed} title="No projects" />
          )}
        </ChartCard>

        {/* 6. By Priority */}
        <ChartCard
          index={9}
          title="By Priority"
          subtitle="Task distribution by priority"
          icon={Flag}
        >
          {priorityData.length > 0 ? (
            <>
              <SimpleBar data={priorityData} height={180} />
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {PRIORITIES.map((p) => {
                  const count = data.priorityDist[p.value] ?? 0;
                  if (count === 0) return null;
                  const m = PRIORITY_META[p.value];
                  return (
                    <span
                      key={p.value}
                      className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground"
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
                      {m.label}
                      <span className="tabular-nums text-foreground">{count}</span>
                    </span>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState icon={CircleDashed} title="No priorities" />
          )}
        </ChartCard>

        {/* 7. Status Mix */}
        <ChartCard
          index={10}
          title="Status Mix"
          subtitle="Task status distribution"
          icon={PieChart}
        >
          {Object.keys(data.statusDist).length > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <StatusDonut data={data.statusDist} height={220} />
              </div>
              <div className="grid w-full grid-cols-1 gap-1 sm:w-44">
                {Object.entries(data.statusDist)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 7)
                  .map(([status, count]) => {
                    const meta = STATUS_META[status as TaskStatus];
                    return (
                      <div
                        key={status}
                        className="flex items-center justify-between gap-2 text-[11px]"
                      >
                        <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                          <span
                            className={cn(
                              "h-1.5 w-1.5 shrink-0 rounded-full",
                              meta?.bg ?? "bg-muted"
                            )}
                          />
                          <span className="truncate">{meta?.label ?? status}</span>
                        </span>
                        <span className="font-medium tabular-nums text-foreground">
                          {count}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <EmptyState icon={CircleDashed} title="No status data" />
          )}
        </ChartCard>

        {/* 8. Team Utilization - full width */}
        <ChartCard
          index={11}
          title="Team Utilization"
          subtitle="Estimate vs capacity · current sprint"
          icon={Users}
          className="lg:col-span-2"
        >
          {data.utilization.length > 0 ? (
            <UtilizationTable rows={data.utilization} />
          ) : (
            <EmptyState icon={CircleDashed} title="No utilization data" />
          )}
        </ChartCard>

        {/* 9. Risk × Impact Matrix */}
        <ChartCard
          index={12}
          title="Risk × Impact Matrix"
          subtitle="Task count by risk level and impact"
          icon={AlertTriangle}
        >
          <RiskMatrix
            risks={RISKS}
            impacts={IMPACTS}
            lookup={riskLookup}
            max={maxRiskCount}
          />
        </ChartCard>

        {/* 10. Daily Activity - full width */}
        <ChartCard
          index={13}
          title="Daily Activity"
          subtitle="Daily update frequency · last 15 weeks"
          icon={Activity}
          className="lg:col-span-2"
        >
          {data.heatmap.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="overflow-x-auto scrollbar-thin">
                <Heatmap data={data.heatmap} weeks={15} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
                <span>15 weeks ago</span>
                <div className="flex items-center gap-1.5">
                  <span>Less</span>
                  <div className="h-2.5 w-2.5 rounded-sm bg-muted/50" />
                  <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500/25" />
                  <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500/45" />
                  <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500/70" />
                  <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                  <span>More</span>
                </div>
                <span>Today</span>
              </div>
            </div>
          ) : (
            <EmptyState icon={CircleDashed} title="No activity data" />
          )}
        </ChartCard>
      </div>
    </div>
  );
}

export default AnalyticsView;
