import { NextRequest, NextResponse } from "next/server";
import { db, withDb } from "@/lib/db";
import { serializeTask } from "@/lib/serialize";
import type { TaskRaw } from "@/lib/types";
export const dynamic = "force-dynamic";

async function _GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = await db.task.findUnique({ where: { id }, include: { owner: true } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...serializeTask(task), owner: task.owner });
}

async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as Partial<TaskRaw>;
  const data: Record<string, unknown> = {};
  const fields: (keyof TaskRaw)[] = [
    "title", "description", "priority", "severity", "category", "project",
    "epic", "story", "sprintId", "ownerId", "startDate", "endDate",
    "expectedCompletion", "actualCompletion", "riskLevel", "businessImpact",
    "status", "remarks", "estimate", "progress", "order",
  ];
  for (const f of fields) {
    if (body[f] !== undefined) data[f] = body[f];
  }
  if (body.dependencies !== undefined) data.dependencies = JSON.stringify(body.dependencies);
  if (body.tags !== undefined) data.tags = JSON.stringify(body.tags);
  if (body.links !== undefined) data.links = JSON.stringify(body.links);

  const updated = await db.task.update({ where: { id }, data, include: { owner: true } });
  return NextResponse.json({ ...serializeTask(updated), owner: updated.owner });
}

async function _DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export const GET = withDb(_GET);
export const PATCH = withDb(_PATCH);
export const DELETE = withDb(_DELETE);
