import { NextResponse } from "next/server";
import { db, withDb } from "@/lib/db";
import {
  serializeSprint,
  serializeEmployee,
  serializeTask,
  serializeDailyUpdate,
  serializeNote,
} from "@/lib/serialize";
import {
  sprintForDate,
  idealBurndown,
  sprintTimeline,
  addDays,
} from "@/lib/sprint";

export const dynamic = "force-dynamic";

async function _GET() {
  const today = new Date();
  const current = sprintForDate(today);

  const currentSprintRow = await db.sprint.findFirst({
    where: { number: current.number },
  });
  let currentSprint = currentSprintRow;
  if (!currentSprint) {
    currentSprint = await db.sprint.create({
      data: {
        number: current.number,
        name: current.name,
        startDate: current.startDate.toISOString().slice(0, 10),
        endDate: current.endDate.toISOString().slice(0, 10),
        status: "active",
        goals: JSON.stringify([]),
        objectives: JSON.stringify([]),
        risks: JSON.stringify([]),
        achievements: JSON.stringify([]),
        documents: JSON.stringify([]),
        actionItems: JSON.stringify([]),
        lessonsLearned: JSON.stringify([]),
      },
    });
  }

  const sprintId = currentSprint.id;

  const employees = await db.employee.findMany({ orderBy: { name: "asc" } });

  const sprintTasks = await db.task.findMany({
    where: { sprintId },
    include: { owner: true },
    orderBy: { order: "asc" },
  });

  const totalTasks = sprintTasks.length;
  const completedTasks = sprintTasks.filter(
    (t) => t.status === "completed" || t.status === "released" || t.status === "ready_for_release"
  );
  const blockedTasks = sprintTasks.filter(
    (t) => t.status === "blocked" || t.status === "waiting" || t.status === "needs_attention"
  );
  const delayedTasks = sprintTasks.filter((t) => t.status === "delayed");
  const inProgressTasks = sprintTasks.filter(
    (t) =>
      t.status === "in_progress" ||
      t.status === "development" ||
      t.status === "review" ||
      t.status === "testing"
  );
  const highPriorityTasks = sprintTasks.filter(
    (t) => t.priority === "high" || t.priority === "critical"
  );

  const totalEstimate = sprintTasks.reduce((s, t) => s + t.estimate, 0);
  const completedEstimate = completedTasks.reduce((s, t) => s + t.estimate, 0);
  const overallCompletion =
    totalEstimate > 0 ? Math.round((completedEstimate / totalEstimate) * 100) : 0;

  const timeline = sprintTimeline(current.startDate, current.endDate, today);
  const workingDays = timeline.filter((d) => !d.isWeekend && (d.isToday || d.isPast));
  const ideal = idealBurndown(current.startDate, totalEstimate, today);

  const burndown = workingDays.map((d) => {
    const doneUpToDay = sprintTasks
      .filter((t) => {
        if (!t.actualCompletion) return false;
        const ac = new Date(t.actualCompletion);
        return ac <= d.date;
      })
      .reduce((s, t) => s + t.estimate, 0);
    return {
      day: d.shortLabel,
      label: d.label,
      ideal: ideal.find((x) => x.label === d.label)?.ideal ?? 0,
      actual: Math.max(0, totalEstimate - doneUpToDay),
      isToday: d.isToday,
    };
  });

  const sprints = await db.sprint.findMany({ orderBy: { number: "asc" } });
  const velocity = await Promise.all(
    sprints.map(async (sp) => {
      const tasks = await db.task.findMany({ where: { sprintId: sp.id } });
      const completed = tasks
        .filter(
          (t) =>
            t.status === "completed" ||
            t.status === "released" ||
            t.status === "ready_for_release"
        )
        .reduce((s, t) => s + t.estimate, 0);
      const planned = tasks.reduce((s, t) => s + t.estimate, 0);
      return {
        sprint: sp.name,
        number: sp.number,
        completed,
        planned,
        status: sp.status,
      };
    })
  );

  const workload = employees.map((e) => {
    const tasks = sprintTasks.filter((t) => t.ownerId === e.id);
    const estimate = tasks.reduce((s, t) => s + t.estimate, 0);
    const completed = tasks
      .filter(
        (t) =>
          t.status === "completed" ||
          t.status === "released" ||
          t.status === "ready_for_release"
      )
      .reduce((s, t) => s + t.estimate, 0);
    return {
      employee: serializeEmployee(e),
      taskCount: tasks.length,
      estimate,
      completed,
      capacity: e.capacity,
      utilization: e.capacity > 0 ? Math.round((estimate / e.capacity) * 100) : 0,
    };
  });

  const statusDist: Record<string, number> = {};
  for (const t of sprintTasks) {
    statusDist[t.status] = (statusDist[t.status] || 0) + 1;
  }

  const riskDist: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const t of sprintTasks) {
    riskDist[t.riskLevel] = (riskDist[t.riskLevel] || 0) + 1;
  }

  const heatStart = addDays(today, -34);
  const heatEnd = today;
  const recentUpdates = await db.dailyUpdate.findMany({
    where: {
      date: {
        gte: heatStart.toISOString().slice(0, 10),
        lte: heatEnd.toISOString().slice(0, 10),
      },
    },
  });
  const heatmap: { date: string; count: number }[] = [];
  for (let i = 0; i < 35; i++) {
    const d = addDays(heatStart, i);
    const ds = d.toISOString().slice(0, 10);
    heatmap.push({ date: ds, count: recentUpdates.filter((u) => u.date === ds).length });
  }

  const recentDates: string[] = [];
  for (let i = 0; i < 4; i++) {
    const d = addDays(today, -i);
    recentDates.push(d.toISOString().slice(0, 10));
  }
  const recentDailyUpdates = await db.dailyUpdate.findMany({
    where: { date: { in: recentDates } },
    include: { employee: true, task: true },
    orderBy: { date: "desc" },
    take: 40,
  });

  const todayStr = today.toISOString().slice(0, 10);
  const todaysUpdates = await db.dailyUpdate.findMany({
    where: { date: todayStr },
    include: { employee: true, task: true },
  });

  const notes = await db.note.findMany({
    where: { sprintId },
    include: { employee: true, task: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const upcoming = sprintTasks
    .filter((t) => {
      if (!t.endDate) return false;
      if (t.status === "completed" || t.status === "released" || t.status === "cancelled") return false;
      const end = new Date(t.endDate);
      const diff = (end.getTime() - today.getTime()) / 86400000;
      return diff >= -1 && diff <= 7;
    })
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 8);

  const overdue = sprintTasks.filter((t) => {
    if (!t.endDate) return false;
    if (t.status === "completed" || t.status === "released" || t.status === "cancelled") return false;
    return new Date(t.endDate) < today;
  });

  const notifications: {
    id: string;
    type: string;
    title: string;
    detail: string;
    severity: string;
  }[] = [];
  for (const t of overdue.slice(0, 8)) {
    notifications.push({
      id: `overdue-${t.id}`,
      type: "overdue",
      title: `Overdue: ${t.title}`,
      detail: t.owner?.name ? `Owned by ${t.owner.name}` : "Unassigned",
      severity: "high",
    });
  }
  for (const t of blockedTasks.slice(0, 6)) {
    notifications.push({
      id: `blocked-${t.id}`,
      type: "blocked",
      title: `Blocked: ${t.title}`,
      detail: t.remarks || t.owner?.name || "—",
      severity: "high",
    });
  }
  for (const t of delayedTasks.slice(0, 6)) {
    notifications.push({
      id: `delayed-${t.id}`,
      type: "delayed",
      title: `Delayed: ${t.title}`,
      detail: t.owner?.name || "—",
      severity: "medium",
    });
  }
  if (current.daysRemaining <= 4) {
    notifications.push({
      id: "sprint-ending",
      type: "sprint",
      title: `Sprint ${current.number} ending in ${current.daysRemaining} days`,
      detail: "Wrap up in-progress work",
      severity: "medium",
    });
  }
  const unassigned = sprintTasks.filter((t) => !t.ownerId);
  for (const t of unassigned.slice(0, 4)) {
    notifications.push({
      id: `unassigned-${t.id}`,
      type: "unassigned",
      title: `Unassigned: ${t.title}`,
      detail: "Needs an owner",
      severity: "low",
    });
  }

  const sprintList = sprints.map(serializeSprint);

  return NextResponse.json({
    now: today.toISOString(),
    sprint: serializeSprint(currentSprint),
    sprintInfo: current,
    sprints: sprintList,
    employees: employees.map(serializeEmployee),
    sprintTasks: sprintTasks.map((t) => ({
      ...serializeTask(t),
      owner: t.owner ? serializeEmployee(t.owner) : null,
    })),
    metrics: {
      totalTasks,
      completedTasks: completedTasks.length,
      blockedTasks: blockedTasks.length,
      delayedTasks: delayedTasks.length,
      inProgressTasks: inProgressTasks.length,
      highPriorityTasks: highPriorityTasks.length,
      unassignedTasks: unassigned.length,
      overdueTasks: overdue.length,
      totalEstimate,
      completedEstimate,
      overallCompletion,
    },
    burndown,
    velocity,
    workload,
    statusDist,
    riskDist,
    heatmap,
    recentUpdates: recentDailyUpdates.map((u) => ({
      ...serializeDailyUpdate(u),
      employee: u.employee ? serializeEmployee(u.employee) : null,
      task: u.task ? serializeTask(u.task) : null,
    })),
    todaysUpdates: todaysUpdates.map((u) => ({
      ...serializeDailyUpdate(u),
      employee: u.employee ? serializeEmployee(u.employee) : null,
      task: u.task ? serializeTask(u.task) : null,
    })),
    notes: notes.map((n) => ({
      ...serializeNote(n),
      employee: n.employee ? serializeEmployee(n.employee) : null,
      task: n.task ? serializeTask(n.task) : null,
    })),
    upcoming: upcoming.map((t) => ({
      ...serializeTask(t),
      owner: t.owner ? serializeEmployee(t.owner) : null,
    })),
    overdue: overdue.map((t) => ({
      ...serializeTask(t),
      owner: t.owner ? serializeEmployee(t.owner) : null,
    })),
    notifications,
  });
}

export const GET = withDb(_GET);
