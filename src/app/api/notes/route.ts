import { NextRequest, NextResponse } from "next/server";
import { db, withDb } from "@/lib/db";
import { serializeNote } from "@/lib/serialize";
import type { NoteRaw } from "@/lib/types";
export const dynamic = "force-dynamic";

async function _GET(req: NextRequest) {
  const url = req.nextUrl;
  const sprintId = url.searchParams.get("sprintId");
  const employeeId = url.searchParams.get("employeeId");
  const taskId = url.searchParams.get("taskId");
  const where: Record<string, unknown> = {};
  if (sprintId) where.sprintId = sprintId;
  if (employeeId) where.employeeId = employeeId;
  if (taskId) where.taskId = taskId;
  const notes = await db.note.findMany({
    where,
    include: { employee: true, task: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    notes.map((n) => ({ ...serializeNote(n), employee: n.employee, task: n.task }))
  );
}

async function _POST(req: NextRequest) {
  const body = (await req.json()) as Partial<NoteRaw>;
  const created = await db.note.create({
    data: {
      content: body.content || "",
      type: body.type || "general",
      sprintId: body.sprintId || null,
      employeeId: body.employeeId || null,
      taskId: body.taskId || null,
    },
    include: { employee: true, task: true },
  });
  return NextResponse.json({
    ...serializeNote(created),
    employee: created.employee,
    task: created.task,
  });
}

export const GET = withDb(_GET);
export const POST = withDb(_POST);
