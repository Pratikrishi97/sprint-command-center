import { NextRequest, NextResponse } from "next/server";
import { db, withDb } from "@/lib/db";
import { serializeSprint } from "@/lib/serialize";
import { sprintForDate, getSprintByNumber } from "@/lib/sprint";
export const dynamic = "force-dynamic";

async function _GET() {
  let sprints = await db.sprint.findMany({ orderBy: { number: "asc" } });
  // ensure current sprint exists
  const current = sprintForDate(new Date());
  if (!sprints.find((s) => s.number === current.number)) {
    const created = await db.sprint.create({
      data: {
        number: current.number,
        name: current.name,
        startDate: current.startDate.toISOString().slice(0, 10),
        endDate: current.endDate.toISOString().slice(0, 10),
        status: "active",
        goals: JSON.stringify([]),
        objectives: JSON.stringify([]),
        risks: JSON.stringify([]),
        achievements: JSON.stringify([]),
        documents: JSON.stringify([]),
        actionItems: JSON.stringify([]),
        lessonsLearned: JSON.stringify([]),
      },
    });
    sprints = [...sprints, created].sort((a, b) => a.number - b.number);
  }
  return NextResponse.json(sprints.map(serializeSprint));
}

export const GET = withDb(_GET);
