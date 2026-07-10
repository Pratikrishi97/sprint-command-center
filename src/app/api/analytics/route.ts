import { NextResponse } from "next/server";
import { db, withDb } from "@/lib/db";
import { sprintForDate, addDays } from "@/lib/sprint";
export const dynamic = "force-dynamic";

async function _GET() {
  const sprints = await db.sprint.findMany({ orderBy: { number: "asc" } });
  const today = new Date();
  const current = sprintForDate(today);

  // Velocity per sprint with breakdown
  const velocity = await Promise.all(
    sprints.map(async (sp) => {
      const tasks = await db.task.findMany({ where: { sprintId: sp.id } });
      const completed = tasks
        .filter((t) => t.status === "completed" || t.status === "released" || t.status === "ready_for_release")
        .reduce((s, t) => s + t.estimate, 0);
      const planned = tasks.reduce((s, t) => s + t.estimate, 0);
      const carryover = tasks.filter((t) => t.status === "delayed").length;
      return {
        sprint: sp.name,
        number: sp.number,
        completed,
        planned,
        carryover,
        status: sp.status,
      };
    })
  );

  // Task distribution by category & project (across all)
  const allTasks = await db.task.findMany();
  const categoryDist: Record<string, number> = {};
  const projectDist: Record<string, number> = {};
  const priorityDist: Record<string, number> = {};
  const statusDist: Record<string, number> = {};
  for (const t of allTasks) {
    categoryDist[t.category] = (categoryDist[t.category] || 0) + 1;
    projectDist[t.project] = (projectDist[t.project] || 0) + 1;
    priorityDist[t.priority] = (priorityDist[t.priority] || 0) + 1;
    statusDist[t.status] = (statusDist[t.status] || 0) + 1;
  }

  // Employee utilization across current sprint
  const currentSprint = sprints.find((s) => s.number === current.number);
  const employees = await db.employee.findMany({ orderBy: { name: "asc" } });
  const currentTasks = currentSprint
    ? await db.task.findMany({ where: { sprintId: currentSprint.id }, include: { owner: true } })
    : [];
  const utilization = employees.map((e) => {
    const tasks = currentTasks.filter((t) => t.ownerId === e.id);
    const estimate = tasks.reduce((s, t) => s + t.estimate, 0);
    const completed = tasks
      .filter((t) => t.status === "completed" || t.status === "released" || t.status === "ready_for_release")
      .reduce((s, t) => s + t.estimate, 0);
    return {
      name: e.name,
      team: e.team,
      capacity: e.capacity,
      estimate,
      completed,
      utilization: e.capacity > 0 ? Math.round((estimate / e.capacity) * 100) : 0,
      taskCount: tasks.length,
    };
  });

  // Risk matrix: count by risk x impact
  const riskMatrix: { risk: string; impact: string; count: number }[] = [];
  for (const risk of ["low", "medium", "high", "critical"]) {
    for (const impact of ["low", "medium", "high"]) {
      const count = allTasks.filter(
        (t) => t.riskLevel === risk && t.businessImpact === impact
      ).length;
      riskMatrix.push({ risk, impact, count });
    }
  }

  // Activity heatmap (last 105 days)
  const heatStart = addDays(today, -104);
  const updates = await db.dailyUpdate.findMany({
    where: {
      date: {
        gte: heatStart.toISOString().slice(0, 10),
        lte: today.toISOString().slice(0, 10),
      },
    },
  });
  const heatmap: { date: string; count: number }[] = [];
  for (let i = 0; i < 105; i++) {
    const d = addDays(heatStart, i);
    const ds = d.toISOString().slice(0, 10);
    heatmap.push({ date: ds, count: updates.filter((u) => u.date === ds).length });
  }

  // Completion trend (cumulative completion % per sprint)
  const completionTrend = velocity.map((v) => ({
    sprint: v.sprint,
    number: v.number,
    pct: v.planned > 0 ? Math.round((v.completed / v.planned) * 100) : 0,
  }));

  // Sprint comparison (last 6)
  const recentSprints = velocity.slice(-6);

  return NextResponse.json({
    velocity,
    completionTrend,
    recentSprints,
    categoryDist,
    projectDist,
    priorityDist,
    statusDist,
    utilization,
    riskMatrix,
    heatmap,
  });
}

export const GET = withDb(_GET);
