import { NextRequest, NextResponse } from "next/server";
import { db, withDb } from "@/lib/db";
import { serializeEmployee, serializeTask, serializeDailyUpdate, serializeNote } from "@/lib/serialize";
import { addDays } from "@/lib/sprint";
export const dynamic = "force-dynamic";

async function _GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const employee = await db.employee.findUnique({
    where: { id },
    include: { manager: true, reports: true },
  });
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tasks = await db.task.findMany({
    where: { ownerId: id },
    include: { owner: true, sprint: true },
    orderBy: { createdAt: "desc" },
  });

  const dailyUpdates = await db.dailyUpdate.findMany({
    where: { employeeId: id },
    include: { task: true, sprint: true },
    orderBy: { date: "desc" },
    take: 60,
  });

  const notes = await db.note.findMany({
    where: { employeeId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Activity heatmap (last 91 days = 13 weeks)
  const today = new Date();
  const heatStart = addDays(today, -90);
  const heatUpdates = await db.dailyUpdate.findMany({
    where: {
      employeeId: id,
      date: {
        gte: heatStart.toISOString().slice(0, 10),
        lte: today.toISOString().slice(0, 10),
      },
    },
  });
  const heatmap: { date: string; count: number; hours: number }[] = [];
  for (let i = 0; i < 91; i++) {
    const d = addDays(heatStart, i);
    const ds = d.toISOString().slice(0, 10);
    const dayUpdates = heatUpdates.filter((u) => u.date === ds);
    heatmap.push({
      date: ds,
      count: dayUpdates.length,
      hours: dayUpdates.reduce((s, u) => s + u.hoursWorked, 0),
    });
  }

  // Performance per sprint (completed estimate)
  const sprintMap = new Map<string, { name: string; number: number }>();
  for (const t of tasks) {
    if (t.sprint && !sprintMap.has(t.sprint.id)) {
      sprintMap.set(t.sprint.id, { name: t.sprint.name, number: t.sprint.number });
    }
  }
  const performance = await Promise.all(
    Array.from(sprintMap.entries()).map(async ([sid, s]) => {
      const sTasks = tasks.filter((t) => t.sprintId === sid);
      const estimate = sTasks.reduce((sum, t) => sum + t.estimate, 0);
      const completed = sTasks
        .filter(
          (t) =>
            t.status === "completed" ||
            t.status === "released" ||
            t.status === "ready_for_release"
        )
        .reduce((sum, t) => sum + t.estimate, 0);
      return {
        sprintId: sid,
        sprint: s.name,
        number: s.number,
        taskCount: sTasks.length,
        estimate,
        completed,
        completionPct: estimate > 0 ? Math.round((completed / estimate) * 100) : 0,
      };
    })
  ).then((arr) => arr.sort((a, b) => a.number - b.number));

  // Current sprint workload
  const currentTasks = tasks.filter((t) => t.sprint?.status === "active");
  const currentEstimate = currentTasks.reduce((s, t) => s + t.estimate, 0);
  const currentCompleted = currentTasks
    .filter((t) => t.status === "completed" || t.status === "released" || t.status === "ready_for_release")
    .reduce((s, t) => s + t.estimate, 0);

  return NextResponse.json({
    employee: serializeEmployee(employee),
    manager: employee.manager ? serializeEmployee(employee.manager) : null,
    reports: employee.reports.map(serializeEmployee),
    tasks: tasks.map((t) => ({ ...serializeTask(t), sprint: t.sprint })),
    currentTasks: currentTasks.map((t) => ({ ...serializeTask(t), sprint: t.sprint })),
    dailyUpdates: dailyUpdates.map((u) => ({
      ...serializeDailyUpdate(u),
      task: u.task,
      sprint: u.sprint,
    })),
    notes: notes.map(serializeNote),
    heatmap,
    performance,
    currentWorkload: {
      taskCount: currentTasks.length,
      estimate: currentEstimate,
      completed: currentCompleted,
      capacity: employee.capacity,
      utilization: employee.capacity > 0 ? Math.round((currentEstimate / employee.capacity) * 100) : 0,
    },
  });
}

export const GET = withDb(_GET);
