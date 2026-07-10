"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  EmployeeRaw,
  TaskRaw,
  SprintRaw,
  DailyUpdateRaw,
  NoteRaw,
} from "@/lib/types";
import type { SprintInfo } from "@/lib/sprint";

async function jfetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "Request failed");
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---------- Dashboard ----------
export interface DashboardData {
  now: string;
  sprint: SprintRaw;
  sprintInfo: SprintInfo;
  sprints: SprintRaw[];
  employees: EmployeeRaw[];
  sprintTasks: (TaskRaw & { owner: EmployeeRaw | null })[];
  metrics: {
    totalTasks: number;
    completedTasks: number;
    blockedTasks: number;
    delayedTasks: number;
    inProgressTasks: number;
    highPriorityTasks: number;
    unassignedTasks: number;
    overdueTasks: number;
    totalEstimate: number;
    completedEstimate: number;
    overallCompletion: number;
  };
  burndown: { day: string; label: string; ideal: number; actual: number; isToday: boolean }[];
  velocity: { sprint: string; number: number; completed: number; planned: number; status: string }[];
  workload: {
    employee: EmployeeRaw;
    taskCount: number;
    estimate: number;
    completed: number;
    capacity: number;
    utilization: number;
  }[];
  statusDist: Record<string, number>;
  riskDist: Record<string, number>;
  heatmap: { date: string; count: number }[];
  recentUpdates: (DailyUpdateRaw & {
    employee: EmployeeRaw | null;
    task: TaskRaw | null;
  })[];
  todaysUpdates: (DailyUpdateRaw & {
    employee: EmployeeRaw | null;
    task: TaskRaw | null;
  })[];
  notes: (NoteRaw & { employee: EmployeeRaw | null; task: TaskRaw | null })[];
  upcoming: (TaskRaw & { owner: EmployeeRaw | null })[];
  overdue: (TaskRaw & { owner: EmployeeRaw | null })[];
  notifications: {
    id: string;
    type: string;
    title: string;
    detail: string;
    severity: string;
  }[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => jfetch<DashboardData>("/api/dashboard"),
    refetchInterval: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

// ---------- Employees ----------
export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: () => jfetch<EmployeeRaw[]>("/api/employees"),
  });
}

export function useEmployeeDetail(id: string | null) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: () => jfetch(`/api/employees/${id}/detail`),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<EmployeeRaw>) =>
      jfetch<EmployeeRaw>("/api/employees", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Employee added");
    },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<EmployeeRaw> }) =>
      jfetch<EmployeeRaw>(`/api/employees/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["employee", vars.id] });
      toast.success("Employee updated");
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      jfetch(`/api/employees/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Employee removed");
    },
  });
}

// ---------- Tasks ----------
export function useTasks(params?: { sprintId?: string; ownerId?: string; status?: string[]; priority?: string[] }) {
  const qs = new URLSearchParams();
  if (params?.sprintId) qs.set("sprintId", params.sprintId);
  if (params?.ownerId) qs.set("ownerId", params.ownerId);
  params?.status?.forEach((s) => qs.append("status", s));
  params?.priority?.forEach((p) => qs.append("priority", p));
  const q = qs.toString();
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: () => jfetch<(TaskRaw & { owner: EmployeeRaw | null })[]>(`/api/tasks${q ? `?${q}` : ""}`),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<TaskRaw>) =>
      jfetch<TaskRaw>("/api/tasks", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task created");
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<TaskRaw> }) =>
      jfetch<TaskRaw>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (vars.body.status !== undefined || vars.body.progress !== undefined) {
        qc.invalidateQueries({ queryKey: ["sprint-detail"] });
      }
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jfetch(`/api/tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task deleted");
    },
  });
}

// ---------- Sprints ----------
export function useSprints() {
  return useQuery({
    queryKey: ["sprints"],
    queryFn: () => jfetch<SprintRaw[]>("/api/sprints"),
  });
}

export interface SprintDetail {
  sprint: SprintRaw;
  info: unknown;
  tasks: (TaskRaw & { owner: EmployeeRaw | null })[];
  employees: EmployeeRaw[];
  notes: (NoteRaw & { employee: EmployeeRaw | null; task: TaskRaw | null })[];
  dailyUpdates: DailyUpdateRaw[];
  burndown: { day: string; label: string; ideal: number; actual: number; isToday: boolean }[];
  burnup: { day: string; label: string; completed: number; scope: number; isToday: boolean }[];
  workload: {
    employee: EmployeeRaw;
    taskCount: number;
    estimate: number;
    completed: number;
    capacity: number;
    utilization: number;
  }[];
  statusDist: Record<string, number>;
  riskDist: Record<string, number>;
  totalEstimate: number;
  completedEstimate: number;
  velocity: { completed: number; planned: number };
}

export function useSprintDetail(id: string | null) {
  return useQuery({
    queryKey: ["sprint-detail", id],
    queryFn: () => jfetch<SprintDetail>(`/api/sprints/${id}`),
    enabled: !!id,
  });
}

export function useUpdateSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      jfetch<SprintRaw>(`/api/sprints/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["sprints"] });
      qc.invalidateQueries({ queryKey: ["sprint-detail", vars.id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Sprint updated");
    },
  });
}

// ---------- Daily Updates ----------
export function useDailyUpdates(params?: { sprintId?: string; employeeId?: string; date?: string }) {
  const qs = new URLSearchParams();
  if (params?.sprintId) qs.set("sprintId", params.sprintId);
  if (params?.employeeId) qs.set("employeeId", params.employeeId);
  if (params?.date) qs.set("date", params.date);
  const q = qs.toString();
  return useQuery({
    queryKey: ["daily-updates", params],
    queryFn: () =>
      jfetch<(DailyUpdateRaw & { employee: EmployeeRaw | null; task: TaskRaw | null })[]>(
        `/api/daily-updates${q ? `?${q}` : ""}`
      ),
  });
}

export function useCreateDailyUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<DailyUpdateRaw>) =>
      jfetch<DailyUpdateRaw>("/api/daily-updates", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-updates"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Daily update saved");
    },
  });
}

export function useUpdateDailyUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<DailyUpdateRaw> }) =>
      jfetch<DailyUpdateRaw>(`/api/daily-updates/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-updates"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Update saved");
    },
  });
}

// ---------- Notes ----------
export function useNotes(sprintId?: string) {
  const qs = sprintId ? `?sprintId=${sprintId}` : "";
  return useQuery({
    queryKey: ["notes", sprintId],
    queryFn: () =>
      jfetch<(NoteRaw & { employee: EmployeeRaw | null; task: TaskRaw | null })[]>(`/api/notes${qs}`),
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<NoteRaw>) =>
      jfetch<NoteRaw>("/api/notes", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Note added");
    },
  });
}

// ---------- Search ----------
export interface SearchResults {
  employees: EmployeeRaw[];
  tasks: (TaskRaw & { owner: EmployeeRaw | null })[];
  sprints: SprintRaw[];
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => jfetch<SearchResults>(`/api/search?q=${encodeURIComponent(q)}`),
    enabled: q.length > 1,
  });
}

// ---------- Analytics ----------
export interface AnalyticsData {
  velocity: { sprint: string; number: number; completed: number; planned: number; carryover: number; status: string }[];
  completionTrend: { sprint: string; number: number; pct: number }[];
  recentSprints: { sprint: string; number: number; completed: number; planned: number; carryover: number; status: string }[];
  categoryDist: Record<string, number>;
  projectDist: Record<string, number>;
  priorityDist: Record<string, number>;
  statusDist: Record<string, number>;
  utilization: { name: string; team: string; capacity: number; estimate: number; completed: number; utilization: number; taskCount: number }[];
  riskMatrix: { risk: string; impact: string; count: number }[];
  heatmap: { date: string; count: number }[];
}

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: () => jfetch<AnalyticsData>("/api/analytics"),
  });
}
