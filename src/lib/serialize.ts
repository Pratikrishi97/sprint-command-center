import type {
  Sprint,
  Employee,
  Task,
  DailyUpdate,
  Note,
} from "@prisma/client";
import type {
  SprintRaw,
  EmployeeRaw,
  TaskRaw,
  DailyUpdateRaw,
  NoteRaw,
} from "@/lib/types";

function parse<T>(v: string | null, fallback: T): T {
  if (!v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

export function serializeSprint(s: Sprint): SprintRaw {
  return {
    id: s.id,
    number: s.number,
    name: s.name,
    startDate: s.startDate,
    endDate: s.endDate,
    status: s.status as SprintRaw["status"],
    goals: parse(s.goals, []),
    objectives: parse(s.objectives, []),
    retrospective: s.retrospective,
    lessonsLearned: parse(s.lessonsLearned, []),
    actionItems: parse(s.actionItems, []),
    risks: parse(s.risks, []),
    achievements: parse(s.achievements, []),
    documents: parse(s.documents, []),
    capacity: s.capacity,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export function serializeEmployee(e: Employee): EmployeeRaw {
  return {
    id: e.id,
    name: e.name,
    email: e.email,
    role: e.role,
    team: e.team,
    color: e.color,
    avatarUrl: e.avatarUrl,
    managerId: e.managerId,
    capacity: e.capacity,
    availability: e.availability,
    timezone: e.timezone,
    skills: parse(e.skills, []),
    workingDays: parse(e.workingDays, []),
    leaves: parse(e.leaves, []),
    projects: parse(e.projects, []),
    status: e.status as EmployeeRaw["status"],
    joinedAt: e.joinedAt,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export function serializeTask(t: Task): TaskRaw {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority as TaskRaw["priority"],
    severity: t.severity as TaskRaw["severity"],
    category: t.category,
    project: t.project,
    epic: t.epic,
    story: t.story,
    sprintId: t.sprintId,
    ownerId: t.ownerId,
    startDate: t.startDate,
    endDate: t.endDate,
    expectedCompletion: t.expectedCompletion,
    actualCompletion: t.actualCompletion,
    dependencies: parse(t.dependencies, []),
    riskLevel: t.riskLevel as TaskRaw["riskLevel"],
    businessImpact: t.businessImpact,
    status: t.status as TaskRaw["status"],
    tags: parse(t.tags, []),
    remarks: t.remarks,
    links: parse(t.links, []),
    estimate: t.estimate,
    progress: Math.round(t.progress),
    order: t.order,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export function serializeDailyUpdate(d: DailyUpdate): DailyUpdateRaw {
  return {
    id: d.id,
    taskId: d.taskId,
    employeeId: d.employeeId,
    sprintId: d.sprintId,
    date: d.date,
    todayProgress: d.todayProgress,
    yesterdayProgress: d.yesterdayProgress,
    tomorrowPlan: d.tomorrowPlan,
    percentage: Math.round(d.percentage),
    hoursWorked: d.hoursWorked,
    blockers: d.blockers,
    risks: d.risks,
    managerNotes: d.managerNotes,
    dependencies: d.dependencies,
    expectedFinish: d.expectedFinish,
    confidence: d.confidence as DailyUpdateRaw["confidence"],
    mood: d.mood as DailyUpdateRaw["mood"],
    accomplishments: d.accomplishments,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  };
}

export function serializeNote(n: Note): NoteRaw {
  return {
    id: n.id,
    content: n.content,
    type: n.type as NoteRaw["type"],
    sprintId: n.sprintId,
    employeeId: n.employeeId,
    taskId: n.taskId,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

export function serializeTaskWithOwner(t: Task & { owner: Employee | null }): TaskRaw & {
  owner: EmployeeRaw | null;
} {
  return { ...serializeTask(t), owner: t.owner ? serializeEmployee(t.owner) : null };
}
