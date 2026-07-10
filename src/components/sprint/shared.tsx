"use client";

import { cn } from "@/lib/utils";
import { employeeColor, type EmployeeRaw } from "@/lib/types";
import {
  STATUS_META,
  PRIORITY_META,
  RISK_META,
  MOOD_META,
  type TaskStatus,
  type Priority,
  type RiskLevel,
  type Mood,
} from "@/lib/types";

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function EmployeeAvatar({
  employee,
  size = "md",
  ring = true,
}: {
  employee: Pick<EmployeeRaw, "name" | "color" | "avatarUrl">;
  size?: "xs" | "sm" | "md" | "lg";
  ring?: boolean;
}) {
  const c = employeeColor(employee.color);
  const sizes = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
  };
  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm bg-gradient-to-br",
        c.gradient,
        sizes[size],
        ring && "ring-2 ring-background"
      )}
      title={employee.name}
    >
      {initials(employee.name)}
    </div>
  );
}

export function AvatarStack({
  employees,
  max = 4,
  size = "sm",
}: {
  employees: Pick<EmployeeRaw, "name" | "color" | "avatarUrl">[];
  max?: number;
  size?: "xs" | "sm" | "md";
}) {
  const shown = employees.slice(0, max);
  const extra = employees.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((e, i) => (
        <div key={i} style={{ zIndex: shown.length - i }}>
          <EmployeeAvatar employee={e} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground ring-2 ring-background">
          +{extra}
        </div>
      )}
    </div>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) {
  const m = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        m.bg,
        m.text,
        m.ring,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {m.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const m = PRIORITY_META[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        m.bg,
        m.text
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  const m = RISK_META[risk];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        m.bg,
        m.text
      )}
    >
      {m.label} Risk
    </span>
  );
}

export function MoodPill({ mood }: { mood: Mood }) {
  const m = MOOD_META[mood];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", m.color)} title={m.label}>
      <span>{m.emoji}</span>
    </span>
  );
}

export function ProgressRing({
  value,
  size = 40,
  stroke = 4,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;
  const color =
    value >= 100 ? "#10b981" : value >= 60 ? "#0ea5e9" : value >= 30 ? "#f59e0b" : "#ef4444";
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/40" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className="absolute text-[10px] font-semibold">{Math.round(value)}%</span>
    </div>
  );
}
