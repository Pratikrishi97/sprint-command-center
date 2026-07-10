import { NextRequest, NextResponse } from "next/server";
import { db, withDb } from "@/lib/db";
import { serializeEmployee } from "@/lib/serialize";
import type { EmployeeRaw } from "@/lib/types";
export const dynamic = "force-dynamic";

async function _GET() {
  const employees = await db.employee.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(employees.map(serializeEmployee));
}

async function _POST(req: NextRequest) {
  const body = (await req.json()) as Partial<EmployeeRaw>;
  const created = await db.employee.create({
    data: {
      name: body.name || "New Employee",
      email: body.email || `new-${Date.now()}@orbit.dev`,
      role: body.role || "Engineer",
      team: body.team || "Core",
      color: body.color || "emerald",
      avatarUrl: body.avatarUrl || null,
      managerId: body.managerId || null,
      capacity: body.capacity ?? 40,
      availability: body.availability ?? 100,
      timezone: body.timezone || "Asia/Calcutta",
      skills: JSON.stringify(body.skills || []),
      workingDays: JSON.stringify(body.workingDays || [1, 2, 3, 4, 5]),
      leaves: JSON.stringify(body.leaves || []),
      projects: JSON.stringify(body.projects || []),
      status: body.status || "active",
      joinedAt: body.joinedAt || new Date().toISOString().slice(0, 10),
    },
  });
  return NextResponse.json(serializeEmployee(created));
}

export const GET = withDb(_GET);
export const POST = withDb(_POST);
