"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { STATUS_META, type TaskStatus } from "@/lib/types";

const AXIS = { fontSize: 11, fill: "oklch(0.68 0.012 264)" };
const GRID = "oklch(1 0 0 / 6%)";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "oklch(0.7 0.15 300)",
  "oklch(0.7 0.15 180)",
  "oklch(0.7 0.15 30)",
];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      {label && <div className="mb-1 font-medium text-foreground">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span>{p.name}:</span>
          <span className="font-medium text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function BurndownChart({
  data,
  height = 240,
}: {
  data: { day: string; ideal: number; actual: number; isToday: boolean }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="day" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={36} />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="ideal"
          stroke="oklch(0.6 0.02 264)"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          fill="none"
          name="Ideal"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="actual"
          stroke="var(--chart-1)"
          strokeWidth={2.5}
          fill="url(#actualGrad)"
          name="Remaining"
          dot={{ r: 3, fill: "var(--chart-1)", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BurnupChart({
  data,
  height = 240,
}: {
  data: { day: string; completed: number; scope: number; isToday: boolean }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
        <defs>
          <linearGradient id="doneGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="day" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={36} />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="scope" stroke="oklch(0.6 0.02 264)" strokeWidth={1.5} strokeDasharray="4 4" fill="none" name="Scope" dot={false} />
        <Area type="monotone" dataKey="completed" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#doneGrad)" name="Completed" dot={{ r: 3, fill: "var(--chart-1)", strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function VelocityChart({
  data,
  height = 240,
}: {
  data: { sprint: string; completed: number; planned: number; status: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }} barGap={2}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="sprint" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={36} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "oklch(1 0 0 / 4%)" }} />
        <Bar dataKey="planned" fill="oklch(0.45 0.02 264)" radius={[4, 4, 0, 0]} name="Planned" maxBarSize={26} />
        <Bar dataKey="completed" fill="var(--chart-1)" radius={[4, 4, 0, 0]} name="Completed" maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WorkloadChart({
  data,
  height = 260,
}: {
  data: { employee: { name: string; color: string }; estimate: number; capacity: number; utilization: number }[];
  height?: number;
}) {
  const chartData = data.map((d) => ({
    name: d.employee.name.split(" ")[0],
    estimate: d.estimate,
    capacity: d.capacity,
    utilization: d.utilization,
    color: d.employee.color,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={64} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "oklch(1 0 0 / 4%)" }} />
        <Bar dataKey="capacity" fill="oklch(0.3 0.02 264)" radius={[0, 4, 4, 0]} name="Capacity" maxBarSize={18} />
        <Bar dataKey="estimate" fill="var(--chart-1)" radius={[0, 4, 4, 0]} name="Estimate" maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusDonut({
  data,
  height = 220,
}: {
  data: Record<string, number>;
  height?: number;
}) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const chartData = entries.map(([status, count]) => ({
    name: STATUS_META[status as TaskStatus]?.label ?? status,
    value: count,
    status,
  }));
  const colorFor = (status: string) => {
    const m = STATUS_META[status as TaskStatus];
    const map: Record<string, string> = {
      not_started: "oklch(0.6 0.01 264)",
      planning: "oklch(0.65 0.15 300)",
      in_progress: "oklch(0.65 0.16 230)",
      development: "oklch(0.7 0.13 190)",
      review: "oklch(0.75 0.15 80)",
      testing: "oklch(0.7 0.14 170)",
      blocked: "oklch(0.62 0.2 25)",
      waiting: "oklch(0.68 0.16 55)",
      completed: "var(--chart-1)",
      cancelled: "oklch(0.5 0.01 264)",
      delayed: "oklch(0.65 0.2 15)",
      needs_attention: "oklch(0.68 0.18 340)",
      ready_for_release: "oklch(0.72 0.16 130)",
      released: "oklch(0.7 0.17 150)",
    };
    return map[status] ?? "var(--chart-2)";
  };
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={56}
          outerRadius={84}
          paddingAngle={2}
          stroke="none"
        >
          {chartData.map((d, i) => (
            <Cell key={i} fill={colorFor(d.status)} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SimpleBar({
  data,
  height = 220,
  color = "var(--chart-1)",
  dataKey = "value",
  nameKey = "name",
  horizontal = false,
}: {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  color?: string;
  dataKey?: string;
  nameKey?: string;
  horizontal?: boolean;
}) {
  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey={nameKey} tick={AXIS} tickLine={false} axisLine={false} width={80} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "oklch(1 0 0 / 4%)" }} />
          <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} maxBarSize={16}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color ?? color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={nameKey} tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={36} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "oklch(1 0 0 / 4%)" }} />
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} maxBarSize={36}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CompletionGauge({ value, size = 160 }: { value: number; size?: number }) {
  const data = [{ name: "completion", value: value, fill: "var(--chart-1)" }];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="72%"
          outerRadius="100%"
          data={data}
          startAngle={90}
          endAngle={90 - (value / 100) * 360}
        >
          <RadialBar background={{ fill: "oklch(1 0 0 / 6%)" }} dataKey="value" cornerRadius={20} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{value}%</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">complete</span>
      </div>
    </div>
  );
}

export function Heatmap({ data, weeks = 5 }: { data: { date: string; count: number }[]; weeks?: number }) {
  const cells = data.slice(-weeks * 7);
  const max = Math.max(1, ...cells.map((c) => c.count));
  const level = (c: number) => {
    if (c === 0) return "bg-muted/50";
    const r = c / max;
    if (r > 0.75) return "bg-emerald-500";
    if (r > 0.5) return "bg-emerald-500/70";
    if (r > 0.25) return "bg-emerald-500/45";
    return "bg-emerald-500/25";
  };
  return (
    <div className="flex gap-1">
      {Array.from({ length: weeks }).map((_, w) => (
        <div key={w} className="flex flex-col gap-1">
          {cells.slice(w * 7, w * 7 + 7).map((c, i) => (
            <div
              key={i}
              title={`${c.date}: ${c.count} updates`}
              className={cn("h-3 w-3 rounded-sm transition hover:ring-1 hover:ring-sprint-primary", level(c.count))}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
