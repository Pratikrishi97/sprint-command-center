import { NextRequest, NextResponse } from "next/server";
import { db, withDb } from "@/lib/db";
import { serializeTask } from "@/lib/serialize";
import type { TaskRaw } from "@/lib/types";
export const dynamic = "force-dynamic";

async function _GET(req: NextRequest) {
  const url = req.nextUrl;
  const sprintId = url.searchParams.get("sprintId");
  const ownerId = url.searchParams.get("ownerId");
  const status = url.searchParams.getAll("status");
  const priority = url.searchParams.getAll("priority");

  const where: Record<string, unknown> = {};
  if (sprintId) where.sprintId = sprintId;
  if (ownerId) where.ownerId = ownerId;
  if (status.length) where.status = { in: status };
  if (priority.length) where.priority = { in: priority };

  const tasks = await db.task.findMany({
    where,
    include: { owner: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(
    tasks.map((t) => ({ ...serializeTask(t), owner: t.owner }))
  );
}

async function _POST(req: NextRequest) {
  const body = (await req.json()) as Partial<TaskRaw>;
  const created = await db.task.create({
    data: {
      title: body.title || "Untitled task",
      description: body.description || "",
      priority: body.priority || "medium",
      severity: body.severity || "normal",
      category: body.category || "feature",
      project: body.project || "Core",
      epic: body.epic || "",
      story: body.story || "",
      sprintId: body.sprintId || null,
      ownerId: body.ownerId || null,
      startDate: body.startDate || "",
      endDate: body.endDate || "",
      expectedCompletion: body.expectedCompletion || "",
      actualCompletion: body.actualCompletion || "",
      dependencies: JSON.stringify(body.dependencies || []),
      riskLevel: body.riskLevel || "low",
      businessImpact: body.businessImpact || "medium",
      status: body.status || "not_started",
      tags: JSON.stringify(body.tags || []),
      remarks: body.remarks || "",
      links: JSON.stringify(body.links || []),
      estimate: body.estimate ?? 0,
      progress: body.progress ?? 0,
      order: body.order ?? 0,
    },
    include: { owner: true },
  });
  return NextResponse.json({ ...serializeTask(created), owner: created.owner });
}

export const GET = withDb(_GET);
export const POST = withDb(_POST);
