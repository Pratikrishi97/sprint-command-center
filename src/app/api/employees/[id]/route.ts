import { NextRequest, NextResponse } from "next/server";
import { db, withDb } from "@/lib/db";
import { serializeEmployee } from "@/lib/serialize";
import type { EmployeeRaw } from "@/lib/types";
export const dynamic = "force-dynamic";

async function _GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const employee = await db.employee.findUnique({ where: { id } });
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serializeEmployee(employee));
}

async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as Partial<EmployeeRaw>;
  const data: Record<string, unknown> = {};
  const fields: (keyof EmployeeRaw)[] = [
    "name", "email", "role", "team", "color", "avatarUrl", "managerId",
    "capacity", "availability", "timezone", "status", "joinedAt",
  ];
  for (const f of fields) {
    if (body[f] !== undefined) data[f] = body[f];
  }
  if (body.skills !== undefined) data.skills = JSON.stringify(body.skills);
  if (body.workingDays !== undefined) data.workingDays = JSON.stringify(body.workingDays);
  if (body.leaves !== undefined) data.leaves = JSON.stringify(body.leaves);
  if (body.projects !== undefined) data.projects = JSON.stringify(body.projects);

  const updated = await db.employee.update({ where: { id }, data });
  return NextResponse.json(serializeEmployee(updated));
}

async function _DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.employee.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export const GET = withDb(_GET);
export const PATCH = withDb(_PATCH);
export const DELETE = withDb(_DELETE);
