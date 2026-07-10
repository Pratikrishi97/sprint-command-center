import { NextRequest, NextResponse } from "next/server";
import { db, withDb } from "@/lib/db";
import { serializeDailyUpdate } from "@/lib/serialize";
import type { DailyUpdateRaw } from "@/lib/types";
export const dynamic = "force-dynamic";

async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as Partial<DailyUpdateRaw>;
  const data: Record<string, unknown> = {};
  for (const f of [
    "taskId", "employeeId", "sprintId", "date", "todayProgress",
    "yesterdayProgress", "tomorrowPlan", "percentage", "hoursWorked",
    "blockers", "risks", "managerNotes", "dependencies", "expectedFinish",
    "confidence", "mood", "accomplishments",
  ] as const) {
    if (body[f] !== undefined) data[f] = body[f];
  }
  const updated = await db.dailyUpdate.update({
    where: { id },
    data,
    include: { employee: true, task: true },
  });
  return NextResponse.json({
    ...serializeDailyUpdate(updated),
    employee: updated.employee,
    task: updated.task,
  });
}

async function _DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.dailyUpdate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export const PATCH = withDb(_PATCH);
export const DELETE = withDb(_DELETE);
