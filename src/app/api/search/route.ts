import { NextRequest, NextResponse } from "next/server";
import { db, withDb } from "@/lib/db";
export const dynamic = "force-dynamic";

async function _GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() || "";
  if (!q) return NextResponse.json({ employees: [], tasks: [], sprints: [] });

  const [employees, tasks, sprints] = await Promise.all([
    db.employee.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { role: { contains: q } },
          { team: { contains: q } },
        ],
      },
      take: 8,
    }),
    db.task.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { project: { contains: q } },
          { epic: { contains: q } },
          { remarks: { contains: q } },
        ],
      },
      include: { owner: true },
      take: 12,
    }),
    db.sprint.findMany({
      where: {
        OR: [{ name: { contains: q } }, { retrospective: { contains: q } }],
      },
      take: 6,
    }),
  ]);

  return NextResponse.json({
    employees,
    tasks: tasks.map((t) => ({ ...t, owner: t.owner })),
    sprints,
  });
}

export const GET = withDb(_GET);
