import { NextRequest, NextResponse } from "next/server";
import { db, withDb } from "@/lib/db";
import { serializeDailyUpdate } from "@/lib/serialize";
import type { DailyUpdateRaw } from "@/lib/types";
export const dynamic = "force-dynamic";

async function _GET(req: NextRequest) {
  const url = req.nextUrl;
  const sprintId = url.searchParams.get("sprintId");
  const employeeId = url.searchParams.get("employeeId");
  const date = url.searchParams.get("date");
  const taskId = url.searchParams.get("taskId");
  const where: Record<string, unknown> = {};
  if (sprintId) where.sprintId = sprintId;
  if (employeeId) where.employeeId = employeeId;
  if (date) where.date = date;
  if (taskId) where.taskId = taskId;
  const updates = await db.dailyUpdate.findMany({
    where,
    include: { employee: true, task: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(
    updates.map((u) => ({
      ...serializeDailyUpdate(u),
      employee: u.employee,
      task: u.task,
    }))
  );
}

async function _POST(req: NextRequest) {
  const body = (await req.json()) as Partial<DailyUpdateRaw>;
  const created = await db.dailyUpdate.create({
    data: {
      taskId: body.taskId || null,
      employeeId: body.employeeId || "",
      sprintId: body.sprintId || null,
      date: body.date || new Date().toISOString().slice(0, 10),
      todayProgress: body.todayProgress || "",
      yesterdayProgress: body.yesterdayProgress || "",
      tomorrowPlan: body.tomorrowPlan || "",
      percentage: body.percentage ?? 0,
      hoursWorked: body.hoursWorked ?? 0,
      blockers: body.blockers || "",
      risks: body.risks || "",
      managerNotes: body.managerNotes || "",
      dependencies: body.dependencies || "",
      expectedFinish: body.expectedFinish || "",
      confidence: body.confidence || "medium",
      mood: body.mood || "neutral",
      accomplishments: body.accomplishments || "",
    },
    include: { employee: true, task: true },
  });
  return NextResponse.json({
    ...serializeDailyUpdate(created),
    employee: created.employee,
    task: created.task,
  });
}

export const GET = withDb(_GET);
export const POST = withDb(_POST);
