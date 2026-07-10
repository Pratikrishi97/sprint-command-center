import { NextRequest, NextResponse } from "next/server";
import { db, withDb } from "@/lib/db";
import { serializeSprint, serializeTask, serializeEmployee, serializeNote } from "@/lib/serialize";
import { getSprintByNumber, sprintTimeline, idealBurndown, addDays } from "@/lib/sprint";
export const dynamic = "force-dynamic";

async function _GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sprint = await db.sprint.findUnique({ where: { id } });
  if (!sprint) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tasks = await db.task.findMany({
    where: { sprintId: id },
    include: { owner: true },
    orderBy: { order: "asc" },
  });
  const employees = await db.employee.findMany({ orderBy: { name: "asc" } });
  const notes = await db.note.findMany({
    where: { sprintId: id },
    include: { employee: true, task: true },
    orderBy: { createdAt: "desc" },
  });
  const dailyUpdates = await db.dailyUpdate.findMany({
    where: { sprintId: id },
    include: { employee: true, task: true },
    orderBy: { date: "desc" },
  });

  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  const info = getSprintByNumber(sprint.number);

  // burndown
  const totalEstimate = tasks.reduce((s, t) => s + t.estimate, 0);
  const completedEstimate = tasks
    .filter((t) => t.status === "completed" || t.status === "released" || t.status === "ready_for_release")
    .reduce((s, t) => s + t.estimate, 0);
  const timeline = sprintTimeline(start, end, new Date());
  const workingDays = timeline.filter((d) => !d.isWeekend && (d.isToday || d.isPast || sprint.status === "completed"));
  const ideal = idealBurndown(start, totalEstimate, new Date());
  const today = new Date();
  const burndown = workingDays.map((d) => {
    const doneUpToDay = tasks
      .filter((t) => {
        if (!t.actualCompletion) return false;
        return new Date(t.actualCompletion) <= d.date;
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

  // burnup: completed + scope
  const burnup = workingDays.map((d) => {
    const doneUpToDay = tasks
      .filter((t) => {
        if (!t.actualCompletion) return false;
        return new Date(t.actualCompletion) <= d.date;
      })
      .reduce((s, t) => s + t.estimate, 0);
    return {
      day: d.shortLabel,
      label: d.label,
      completed: doneUpToDay,
      scope: totalEstimate,
      isToday: d.isToday,
    };
  });

  // workload
  const workload = employees.map((e) => {
    const empTasks = tasks.filter((t) => t.ownerId === e.id);
    const estimate = empTasks.reduce((s, t) => s + t.estimate, 0);
    const completed = empTasks
      .filter((t) => t.status === "completed" || t.status === "released" || t.status === "ready_for_release")
      .reduce((s, t) => s + t.estimate, 0);
    return {
      employee: serializeEmployee(e),
      taskCount: empTasks.length,
      estimate,
      completed,
      capacity: e.capacity,
      utilization: e.capacity > 0 ? Math.round((estimate / e.capacity) * 100) : 0,
    };
  });

  // status & risk dist
  const statusDist: Record<string, number> = {};
  for (const t of tasks) statusDist[t.status] = (statusDist[t.status] || 0) + 1;
  const riskDist: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const t of tasks) riskDist[t.riskLevel] = (riskDist[t.riskLevel] || 0) + 1;

  return NextResponse.json({
    sprint: serializeSprint(sprint),
    info,
    tasks: tasks.map((t) => ({ ...serializeTask(t), owner: t.owner })),
    employees: employees.map(serializeEmployee),
    notes: notes.map((n) => ({ ...serializeNote(n), employee: n.employee, task: n.task })),
    dailyUpdates,
    burndown,
    burnup,
    workload,
    statusDist,
    riskDist,
    totalEstimate,
    completedEstimate,
    velocity: { completed: completedEstimate, planned: totalEstimate },
  });
}

async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const f of ["name", "status", "capacity", "retrospective"] as const) {
    if (body[f] !== undefined) data[f] = body[f];
  }
  if (body.goals !== undefined) data.goals = JSON.stringify(body.goals);
  if (body.objectives !== undefined) data.objectives = JSON.stringify(body.objectives);
  if (body.risks !== undefined) data.risks = JSON.stringify(body.risks);
  if (body.achievements !== undefined) data.achievements = JSON.stringify(body.achievements);
  if (body.documents !== undefined) data.documents = JSON.stringify(body.documents);
  if (body.actionItems !== undefined) data.actionItems = JSON.stringify(body.actionItems);
  if (body.lessonsLearned !== undefined) data.lessonsLearned = JSON.stringify(body.lessonsLearned);
  const updated = await db.sprint.update({ where: { id }, data });
  return NextResponse.json(serializeSprint(updated));
}

export const GET = withDb(_GET);
export const PATCH = withDb(_PATCH);
