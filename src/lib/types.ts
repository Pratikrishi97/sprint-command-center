// Shared domain types for Sprint Command Center

export type TaskStatus =
  | "not_started"
  | "planning"
  | "in_progress"
  | "development"
  | "review"
  | "testing"
  | "blocked"
  | "waiting"
  | "completed"
  | "cancelled"
  | "delayed"
  | "needs_attention"
  | "ready_for_release"
  | "released";

export type Priority = "low" | "medium" | "high" | "critical";
export type Severity = "trivial" | "normal" | "major" | "critical";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type Confidence = "low" | "medium" | "high";
export type Mood = "great" | "good" | "neutral" | "stressed" | "blocked";
export type EmployeeStatus = "active" | "inactive";

export interface TaskLink {
  label: string;
  url: string;
  type: "github" | "jira" | "figma" | "prd" | "doc" | "other";
}

export interface EmployeeRaw {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string;
  color: string;
  avatarUrl: string | null;
  managerId: string | null;
  capacity: number;
  availability: number;
  timezone: string;
  skills: string[];
  workingDays: number[];
  leaves: { date: string; reason: string }[];
  projects: string[];
  status: EmployeeStatus;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRaw {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  severity: Severity;
  category: string;
  project: string;
  epic: string;
  story: string;
  sprintId: string | null;
  ownerId: string | null;
  startDate: string;
  endDate: string;
  expectedCompletion: string;
  actualCompletion: string;
  dependencies: string[];
  riskLevel: RiskLevel;
  businessImpact: string;
  status: TaskStatus;
  tags: string[];
  remarks: string;
  links: TaskLink[];
  estimate: number;
  progress: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface SprintRaw {
  id: string;
  number: number;
  name: string;
  startDate: string;
  endDate: string;
  status: "active" | "upcoming" | "completed";
  goals: string[];
  objectives: string[];
  retrospective: string;
  lessonsLearned: string[];
  actionItems: string[];
  risks: { title: string; level: RiskLevel; mitigation: string }[];
  achievements: string[];
  documents: { label: string; url: string }[];
  capacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyUpdateRaw {
  id: string;
  taskId: string | null;
  employeeId: string;
  sprintId: string | null;
  date: string;
  todayProgress: string;
  yesterdayProgress: string;
  tomorrowPlan: string;
  percentage: number;
  hoursWorked: number;
  blockers: string;
  risks: string;
  managerNotes: string;
  dependencies: string;
  expectedFinish: string;
  confidence: Confidence;
  mood: Mood;
  accomplishments: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteRaw {
  id: string;
  content: string;
  type: "general" | "blocker" | "risk" | "achievement" | "retro";
  sprintId: string | null;
  employeeId: string | null;
  taskId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------- Status metadata ----------

export const STATUS_META: Record<
  TaskStatus,
  { label: string; color: string; bg: string; text: string; ring: string; group: "todo" | "doing" | "done" | "blocked" }
> = {
  not_started: { label: "Not Started", color: "slate", bg: "bg-slate-500/15", text: "text-slate-300", ring: "ring-slate-500/30", group: "todo" },
  planning: { label: "Planning", color: "violet", bg: "bg-violet-500/15", text: "text-violet-300", ring: "ring-violet-500/30", group: "todo" },
  in_progress: { label: "In Progress", color: "blue", bg: "bg-sky-500/15", text: "text-sky-300", ring: "ring-sky-500/30", group: "doing" },
  development: { label: "Development", color: "cyan", bg: "bg-cyan-500/15", text: "text-cyan-300", ring: "ring-cyan-500/30", group: "doing" },
  review: { label: "Review", color: "amber", bg: "bg-amber-500/15", text: "text-amber-300", ring: "ring-amber-500/30", group: "doing" },
  testing: { label: "Testing", color: "teal", bg: "bg-teal-500/15", text: "text-teal-300", ring: "ring-teal-500/30", group: "doing" },
  blocked: { label: "Blocked", color: "red", bg: "bg-red-500/15", text: "text-red-300", ring: "ring-red-500/30", group: "blocked" },
  waiting: { label: "Waiting", color: "orange", bg: "bg-orange-500/15", text: "text-orange-300", ring: "ring-orange-500/30", group: "blocked" },
  completed: { label: "Completed", color: "emerald", bg: "bg-emerald-500/15", text: "text-emerald-300", ring: "ring-emerald-500/30", group: "done" },
  cancelled: { label: "Cancelled", color: "zinc", bg: "bg-zinc-500/15", text: "text-zinc-400", ring: "ring-zinc-500/30", group: "done" },
  delayed: { label: "Delayed", color: "rose", bg: "bg-rose-500/15", text: "text-rose-300", ring: "ring-rose-500/30", group: "blocked" },
  needs_attention: { label: "Needs Attention", color: "pink", bg: "bg-pink-500/15", text: "text-pink-300", ring: "ring-pink-500/30", group: "blocked" },
  ready_for_release: { label: "Ready for Release", color: "green", bg: "bg-lime-500/15", text: "text-lime-300", ring: "ring-lime-500/30", group: "doing" },
  released: { label: "Released", color: "green", bg: "bg-green-500/20", text: "text-green-300", ring: "ring-green-500/30", group: "done" },
};

export const PRIORITY_META: Record<Priority, { label: string; bg: string; text: string; dot: string }> = {
  low: { label: "Low", bg: "bg-slate-500/15", text: "text-slate-300", dot: "bg-slate-400" },
  medium: { label: "Medium", bg: "bg-sky-500/15", text: "text-sky-300", dot: "bg-sky-400" },
  high: { label: "High", bg: "bg-amber-500/15", text: "text-amber-300", dot: "bg-amber-400" },
  critical: { label: "Critical", bg: "bg-red-500/15", text: "text-red-300", dot: "bg-red-400" },
};

export const RISK_META: Record<RiskLevel, { label: string; bg: string; text: string }> = {
  low: { label: "Low", bg: "bg-emerald-500/15", text: "text-emerald-300" },
  medium: { label: "Medium", bg: "bg-amber-500/15", text: "text-amber-300" },
  high: { label: "High", bg: "bg-orange-500/15", text: "text-orange-300" },
  critical: { label: "Critical", bg: "bg-red-500/15", text: "text-red-300" },
};

export const MOOD_META: Record<Mood, { label: string; emoji: string; color: string }> = {
  great: { label: "Great", emoji: "😊", color: "text-emerald-400" },
  good: { label: "Good", emoji: "🙂", color: "text-sky-400" },
  neutral: { label: "Neutral", emoji: "😐", color: "text-slate-400" },
  stressed: { label: "Stressed", emoji: "😣", color: "text-amber-400" },
  blocked: { label: "Blocked", emoji: "🚫", color: "text-red-400" },
};

export const EMPLOYEE_COLORS: Record<string, { bg: string; text: string; ring: string; gradient: string }> = {
  emerald: { bg: "bg-emerald-500/15", text: "text-emerald-300", ring: "ring-emerald-500/30", gradient: "from-emerald-500 to-teal-500" },
  violet: { bg: "bg-violet-500/15", text: "text-violet-300", ring: "ring-violet-500/30", gradient: "from-violet-500 to-purple-500" },
  sky: { bg: "bg-sky-500/15", text: "text-sky-300", ring: "ring-sky-500/30", gradient: "from-sky-500 to-cyan-500" },
  rose: { bg: "bg-rose-500/15", text: "text-rose-300", ring: "ring-rose-500/30", gradient: "from-rose-500 to-pink-500" },
  amber: { bg: "bg-amber-500/15", text: "text-amber-300", ring: "ring-amber-500/30", gradient: "from-amber-500 to-orange-500" },
  fuchsia: { bg: "bg-fuchsia-500/15", text: "text-fuchsia-300", ring: "ring-fuchsia-500/30", gradient: "from-fuchsia-500 to-pink-500" },
  teal: { bg: "bg-teal-500/15", text: "text-teal-300", ring: "ring-teal-500/30", gradient: "from-teal-500 to-emerald-500" },
  orange: { bg: "bg-orange-500/15", text: "text-orange-300", ring: "ring-orange-500/30", gradient: "from-orange-500 to-red-500" },
};

export function employeeColor(c: string) {
  return EMPLOYEE_COLORS[c] ?? EMPLOYEE_COLORS.emerald;
}
