import type { TaskStatus, Priority, RiskLevel, Severity, Confidence, Mood } from "./types";

export const STATUSES: { value: TaskStatus; label: string; group: string }[] = [
  { value: "not_started", label: "Not Started", group: "Backlog" },
  { value: "planning", label: "Planning", group: "Backlog" },
  { value: "in_progress", label: "In Progress", group: "Active" },
  { value: "development", label: "Development", group: "Active" },
  { value: "review", label: "Review", group: "Active" },
  { value: "testing", label: "Testing", group: "Active" },
  { value: "ready_for_release", label: "Ready for Release", group: "Active" },
  { value: "blocked", label: "Blocked", group: "Issues" },
  { value: "waiting", label: "Waiting", group: "Issues" },
  { value: "delayed", label: "Delayed", group: "Issues" },
  { value: "needs_attention", label: "Needs Attention", group: "Issues" },
  { value: "completed", label: "Completed", group: "Done" },
  { value: "released", label: "Released", group: "Done" },
  { value: "cancelled", label: "Cancelled", group: "Done" },
];

export const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export const RISKS: { value: RiskLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export const SEVERITIES: { value: Severity; label: string }[] = [
  { value: "trivial", label: "Trivial" },
  { value: "normal", label: "Normal" },
  { value: "major", label: "Major" },
  { value: "critical", label: "Critical" },
];

export const CONFIDENCES: { value: Confidence; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const MOODS: { value: Mood; label: string; emoji: string }[] = [
  { value: "great", label: "Great", emoji: "😊" },
  { value: "good", label: "Good", emoji: "🙂" },
  { value: "neutral", label: "Neutral", emoji: "😐" },
  { value: "stressed", label: "Stressed", emoji: "😣" },
  { value: "blocked", label: "Blocked", emoji: "🚫" },
];

// Kanban board columns (ordered)
export const BOARD_COLUMNS: TaskStatus[] = [
  "not_started",
  "planning",
  "in_progress",
  "development",
  "review",
  "testing",
  "blocked",
  "completed",
  "ready_for_release",
];

export const PROJECTS = ["Atlas API", "Orbit Web", "Insights", "Billing", "Mobile", "Infra"];
export const CATEGORIES = ["feature", "bug", "chore", "research", "infra", "design"];
export const TEAMS = ["Platform", "Product", "Growth", "Core"];
export const EMPLOYEE_COLOR_OPTIONS = [
  "emerald", "violet", "sky", "rose", "amber", "fuchsia", "teal", "orange",
];
