// Seed script — generates a rich, realistic Sprint Command Center dataset.
// Run: bun run prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { addDays, differenceInCalendarDays, format, isWeekend, startOfDay } from "date-fns";

const db = new PrismaClient();

const EPOCH = new Date("2026-01-06T00:00:00");
const DURATION = 14;

function sprintStartForDate(date: Date): Date {
  const ref = startOfDay(date);
  const epoch = startOfDay(EPOCH);
  const diff = differenceInCalendarDays(ref, epoch);
  const cycles = Math.floor(diff / DURATION);
  let start = addDays(epoch, cycles * DURATION);
  if (diff < 0) start = addDays(epoch, (cycles - 1) * DURATION);
  return start;
}
function sprintNumber(start: Date): number {
  return Math.round(differenceInCalendarDays(startOfDay(start), startOfDay(EPOCH)) / DURATION) + 1;
}
function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}
function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}
function rand(seed: number) {
  // deterministic pseudo-random
  const x = Math.sin(seed * 999.137) * 10000;
  return x - Math.floor(x);
}

const TEAMS = ["Platform", "Product", "Growth"];
const ROLES = ["Staff Engineer", "Senior Engineer", "Engineer", "Engineering Manager", "Product Designer", "QA Engineer", "Data Analyst", "Tech Lead"];

interface EmpSeed {
  name: string;
  email: string;
  role: string;
  team: string;
  color: string;
  capacity: number;
  skills: string[];
  managerIdx?: number;
}

const EMP_SEEDS: EmpSeed[] = [
  { name: "Aarav Mehta", email: "aarav@orbit.dev", role: "Engineering Manager", team: "Platform", color: "emerald", capacity: 36, skills: ["Go", "K8s", "Architecture"] },
  { name: "Priya Nair", email: "priya@orbit.dev", role: "Staff Engineer", team: "Platform", color: "violet", capacity: 40, skills: ["Go", "Postgres", "Distributed Systems"], managerIdx: 0 },
  { name: "Rohan Kapoor", email: "rohan@orbit.dev", role: "Senior Engineer", team: "Platform", color: "sky", capacity: 40, skills: ["TypeScript", "Node", "Redis"], managerIdx: 0 },
  { name: "Diya Sharma", email: "diya@orbit.dev", role: "Engineer", team: "Platform", color: "teal", capacity: 40, skills: ["Python", "AWS", "Terraform"], managerIdx: 0 },
  { name: "Ishaan Verma", email: "ishaan@orbit.dev", role: "Tech Lead", team: "Product", color: "amber", capacity: 38, skills: ["React", "Next.js", "Design Systems"] },
  { name: "Ananya Reddy", email: "ananya@orbit.dev", role: "Product Designer", team: "Product", color: "rose", capacity: 36, skills: ["Figma", "UX Research", "Prototyping"], managerIdx: 4 },
  { name: "Kabir Singh", email: "kabir@orbit.dev", role: "Senior Engineer", team: "Product", color: "fuchsia", capacity: 40, skills: ["React", "GraphQL", "WebGL"], managerIdx: 4 },
  { name: "Meera Iyer", email: "meera@orbit.dev", role: "QA Engineer", team: "Product", color: "orange", capacity: 40, skills: ["Playwright", "Cypress", "Automation"], managerIdx: 4 },
  { name: "Vivaan Gupta", email: "vivaan@orbit.dev", role: "Senior Engineer", team: "Growth", color: "emerald", capacity: 40, skills: ["Analytics", "SQL", "Experiments"] },
  { name: "Sara Khan", email: "sara@orbit.dev", role: "Data Analyst", team: "Growth", color: "violet", capacity: 36, skills: ["SQL", "dbt", "Looker"], managerIdx: 8 },
  { name: "Arjun Patel", email: "arjun@orbit.dev", role: "Engineer", team: "Growth", color: "sky", capacity: 40, skills: ["React", "A/B Testing", "Segment"], managerIdx: 8 },
];

const PROJECTS = ["Atlas API", "Orbit Web", "Insights", "Billing", "Mobile", "Infra"];
const EPICS = ["Auth Rewrite", "Realtime Sync", "Billing v2", "Onboarding Flow", "Search Platform", "Observability", "Mobile Shell", "Analytics Pipeline"];

interface TaskTemplate {
  title: string;
  category: string;
  project: string;
  epic: string;
  priority: string;
  estimate: number;
}

const TASK_TEMPLATES: TaskTemplate[] = [
  { title: "Implement OAuth2 token rotation flow", category: "feature", project: "Atlas API", epic: "Auth Rewrite", priority: "high", estimate: 8 },
  { title: "Migrate sessions to Redis cluster", category: "infra", project: "Atlas API", epic: "Auth Rewrite", priority: "high", estimate: 5 },
  { title: "Add WebSocket presence channel", category: "feature", project: "Orbit Web", epic: "Realtime Sync", priority: "critical", estimate: 8 },
  { title: "CRDT conflict resolution for offline edits", category: "feature", project: "Orbit Web", epic: "Realtime Sync", priority: "high", estimate: 13 },
  { title: "Stripe webhook idempotency layer", category: "feature", project: "Billing", epic: "Billing v2", priority: "critical", estimate: 5 },
  { title: "Prorate subscription upgrades", category: "feature", project: "Billing", epic: "Billing v2", priority: "medium", estimate: 3 },
  { title: "Usage-based metering pipeline", category: "feature", project: "Billing", epic: "Billing v2", priority: "high", estimate: 8 },
  { title: "Redesign first-run onboarding", category: "design", project: "Orbit Web", epic: "Onboarding Flow", priority: "high", estimate: 5 },
  { title: "Interactive product tour", category: "feature", project: "Orbit Web", epic: "Onboarding Flow", priority: "medium", estimate: 5 },
  { title: "Elasticsearch index migration", category: "infra", project: "Insights", epic: "Search Platform", priority: "high", estimate: 8 },
  { title: "Faceted search UI components", category: "feature", project: "Orbit Web", epic: "Search Platform", priority: "medium", estimate: 5 },
  { title: "Distributed tracing rollout", category: "infra", project: "Infra", epic: "Observability", priority: "medium", estimate: 5 },
  { title: "SLO alerting dashboards", category: "infra", project: "Infra", epic: "Observability", priority: "high", estimate: 3 },
  { title: "Mobile shell + navigation", category: "feature", project: "Mobile", epic: "Mobile Shell", priority: "high", estimate: 8 },
  { title: "Offline cache for mobile", category: "feature", project: "Mobile", epic: "Mobile Shell", priority: "medium", estimate: 8 },
  { title: "Funnel analytics warehouse model", category: "feature", project: "Insights", epic: "Analytics Pipeline", priority: "medium", estimate: 5 },
  { title: "Cohort retention dashboard", category: "feature", project: "Insights", epic: "Analytics Pipeline", priority: "medium", estimate: 5 },
  { title: "Fix race condition in task assignment", category: "bug", project: "Atlas API", epic: "Auth Rewrite", priority: "critical", estimate: 3 },
  { title: "Memory leak in realtime subscriptions", category: "bug", project: "Orbit Web", epic: "Realtime Sync", priority: "high", estimate: 5 },
  { title: "Billing invoice PDF rendering fails on Safari", category: "bug", project: "Billing", epic: "Billing v2", priority: "medium", estimate: 2 },
  { title: "Upgrade Postgres to 16", category: "chore", project: "Infra", epic: "Observability", priority: "low", estimate: 3 },
  { title: "Spike: evaluate ClickHouse for events", category: "research", project: "Insights", epic: "Analytics Pipeline", priority: "low", estimate: 3 },
  { title: "Rate limit public API endpoints", category: "feature", project: "Atlas API", epic: "Auth Rewrite", priority: "high", estimate: 5 },
  { title: "Keyboard shortcuts command palette", category: "feature", project: "Orbit Web", epic: "Onboarding Flow", priority: "medium", estimate: 5 },
  { title: "Dark mode polish across app", category: "design", project: "Orbit Web", epic: "Onboarding Flow", priority: "low", estimate: 3 },
  { title: "Audit log export to S3", category: "feature", project: "Atlas API", epic: "Observability", priority: "medium", estimate: 5 },
  { title: "Notification preferences center", category: "feature", project: "Orbit Web", epic: "Onboarding Flow", priority: "medium", estimate: 5 },
  { title: "Optimize bundle size under 200kb", category: "chore", project: "Orbit Web", epic: "Onboarding Flow", priority: "medium", estimate: 3 },
  { title: "Mobile push notification service", category: "feature", project: "Mobile", epic: "Mobile Shell", priority: "high", estimate: 8 },
];

const STATUSES = [
  "not_started", "planning", "in_progress", "development", "review", "testing",
  "blocked", "waiting", "completed", "delayed", "needs_attention", "ready_for_release", "released",
];

const PRIORITIES = ["low", "medium", "high", "critical"];
const RISKS = ["low", "medium", "high", "critical"];
const MOODS = ["great", "good", "neutral", "stressed", "blocked"];
const PROGRESS_LINES = [
  "Shipped the OAuth token rotation endpoint and wired up integration tests.",
  "Debugged the Redis cluster failover; added health checks.",
  "Built the WebSocket presence channel; testing with 1k concurrent clients.",
  "Resolved CRDT merge conflicts for nested blocks; benchmarking next.",
  "Implemented Stripe webhook idempotency keys; covered edge cases.",
  "Added proration logic for plan upgrades; unit tests passing.",
  "Progress on usage metering; ingesting events from 3 services.",
  "Iterated on onboarding screens based on user testing feedback.",
  "Shipped interactive product tour; measuring activation lift.",
  "Migrated search index to Elasticsearch 8; verified relevance.",
  "Built faceted filter UI; wiring up to API facets.",
  "Rolled out distributed tracing to 90% of services.",
  "Set up SLO dashboards for the top 5 user-facing endpoints.",
  "Implemented mobile navigation; handling deep links.",
  "Offline cache working for read models; sync conflict UX next.",
  "Modeled the activation funnel in dbt; reviewing with growth.",
  "Built cohort retention chart; adding comparison segments.",
  "Fixed task assignment race by adding a row-level lock.",
  "Found and patched the subscription memory leak; profiling clean.",
  "Switched invoice renderer to a headless browser; Safari fixed.",
  "Upgraded Postgres to 16 in staging; load testing.",
  "Prototyped ClickHouse ingestion; 8x faster than Postgres for scans.",
  "Added token-bucket rate limiter on public API; tuning limits.",
  "Shipped command palette with fuzzy search.",
  "Polished dark mode contrast; passing AA everywhere.",
  "Wired audit log export to S3 with daily partitioning.",
  "Built notification preferences center; saving user choices.",
  "Reduced bundle to 184kb via dynamic imports.",
  "Set up APNs + FCM; end-to-end push working on iOS.",
];
const TOMORROW_LINES = [
  "Pair with Diya on the Redis cluster cutover.",
  "Start CRDT benchmark suite; document results.",
  "Write load test for presence channel at 10k clients.",
  "Review the billing metering PR; merge if green.",
  "Begin onboarding A/B test with growth team.",
  "Tune Elasticsearch shard count for production.",
  "Roll tracing out to remaining services.",
  "Implement mobile deep link routing.",
  "Add comparison overlays to retention chart.",
  "Open PR for rate-limit tuning after canary.",
];
const BLOCKER_LINES = [
  "",
  "",
  "",
  "Waiting on DevOps to provision the Redis cluster.",
  "Blocked by Stripe test mode quota; reaching out to support.",
  "Design review pending from Ananya.",
  "Needs API contract decision from Priya.",
  "Blocked: staging environment down for migration.",
  "",
  "Awaiting copy from product marketing.",
];

async function main() {
  console.log("Seeding Sprint Command Center...");
  // Wipe
  await db.note.deleteMany();
  await db.dailyUpdate.deleteMany();
  await db.task.deleteMany();
  await db.employee.deleteMany();
  await db.sprint.deleteMany();

  // ---- Employees ----
  const empIds: string[] = [];
  const now = new Date();
  for (let i = 0; i < EMP_SEEDS.length; i++) {
    const s = EMP_SEEDS[i];
    const joined = addDays(now, -(120 + i * 25));
    const e = await db.employee.create({
      data: {
        name: s.name,
        email: s.email,
        role: s.role,
        team: s.team,
        color: s.color,
        capacity: s.capacity,
        availability: i === 6 ? 80 : 100, // Kabir part-time-ish
        timezone: "Asia/Calcutta",
        skills: JSON.stringify(s.skills),
        workingDays: JSON.stringify([1, 2, 3, 4, 5]),
        leaves: JSON.stringify([]),
        projects: JSON.stringify([s.team]),
        status: "active",
        joinedAt: iso(joined),
      },
    });
    empIds.push(e.id);
  }
  // assign managers
  for (let i = 0; i < EMP_SEEDS.length; i++) {
    const s = EMP_SEEDS[i];
    if (s.managerIdx !== undefined) {
      await db.employee.update({ where: { id: empIds[i] }, data: { managerId: empIds[s.managerIdx] } });
    }
  }
  console.log(`Created ${empIds.length} employees`);

  // ---- Sprints: from 2 to current+1 ----
  const currentStart = sprintStartForDate(now);
  const currentNum = sprintNumber(currentStart);
  const sprintIds: Record<number, string> = {};
  const sprintStarts: Record<number, Date> = {};
  for (let num = 2; num <= currentNum + 1; num++) {
    const start = addDays(EPOCH, (num - 1) * DURATION);
    const end = addDays(start, DURATION);
    sprintStarts[num] = start;
    let status: "active" | "upcoming" | "completed" = "completed";
    if (num === currentNum) status = "active";
    if (num === currentNum + 1) status = "upcoming";

    const isPast = num < currentNum;
    const goals = [
      "Ship the Auth Rewrite to production",
      "Land Realtime Sync v1 behind a flag",
      "Close 90% of P1 bugs in Billing",
      "Improve onboarding activation by 15%",
    ];
    const achievements = isPast ? [
      `Sprint ${num} delivered ${20 + Math.floor(rand(num) * 12)} story points`,
      "Zero sev-1 incidents",
      "Onboarding activation +11%",
    ] : [];
    const sp = await db.sprint.create({
      data: {
        number: num,
        name: `Sprint ${num}`,
        startDate: iso(start),
        endDate: iso(end),
        status,
        goals: JSON.stringify(goals),
        objectives: JSON.stringify([
          { title: "Reliability", desc: "Maintain 99.9% uptime", done: isPast },
          { title: "Velocity", desc: "Deliver 40+ story points", done: isPast },
          { title: "Quality", desc: "Bug escape rate < 5%", done: isPast },
        ]),
        retrospective: isPast
          ? `## Sprint ${num} Retro\n\n### What went well\n- Strong cross-team collaboration on the Auth Rewrite.\n- Realtime Sync spike de-risked the next quarter.\n\n### What didn't\n- Staging instability cost ~1.5 days.\n- Scope crept on the billing metering task.\n\n### Action items\n- Provision dedicated staging for billing.\n- Tighten PRD sign-off for >8pt tasks.`
          : "",
        lessonsLearned: JSON.stringify(isPast ? ["Dedicated staging reduces integration risk", "Early design review catches 60% of rework"] : []),
        actionItems: JSON.stringify(isPast ? [{ title: "Provision billing staging", owner: "Aarav", done: num < currentNum - 1 }] : []),
        risks: JSON.stringify([
          { title: "Redis cluster capacity unverified", level: "high", mitigation: "Load test before cutover" },
          { title: "Stripe API rate limits", level: "medium", mitigation: "Request quota increase" },
        ]),
        achievements: JSON.stringify(achievements),
        documents: JSON.stringify([
          { label: "Sprint Planning Doc", url: "https://docs.example.com/sprint-" + num },
          { label: "Demo Recording", url: "https://meet.example.com/rec-" + num },
        ]),
        capacity: 45,
      },
    });
    sprintIds[num] = sp.id;
  }
  console.log(`Created sprints 2..${currentNum + 1}`);

  // ---- Tasks ----
  const allTaskIds: string[] = [];
  let taskCounter = 0;
  // For each sprint, generate a set of tasks
  for (let num = 2; num <= currentNum; num++) {
    const start = sprintStarts[num];
    const isCurrent = num === currentNum;
    const isPast = num < currentNum;
    // number of tasks scales slightly
    const taskCount = isCurrent ? 18 : 14 + Math.floor(rand(num) * 6);
    for (let t = 0; t < taskCount; t++) {
      const tpl = TASK_TEMPLATES[(taskCounter) % TASK_TEMPLATES.length];
      taskCounter++;
      const ownerIdx = (taskCounter * 3) % empIds.length;
      let status: string;
      let progress = 0;
      if (isPast) {
        // most completed/released, some cancelled
        const r = rand(num * 100 + t);
        if (r < 0.74) { status = "completed"; progress = 100; }
        else if (r < 0.82) { status = "released"; progress = 100; }
        else if (r < 0.9) { status = "ready_for_release"; progress = 100; }
        else if (r < 0.95) { status = "cancelled"; progress = rand(num + t) * 40; }
        else { status = "delayed"; progress = 60 + rand(t) * 30; }
      } else {
        // current sprint — vibrant mix
        const r = rand(num * 1000 + t);
        if (r < 0.12) { status = "completed"; progress = 100; }
        else if (r < 0.2) { status = "in_progress"; progress = 40 + rand(t) * 30; }
        else if (r < 0.32) { status = "development"; progress = 30 + rand(t) * 40; }
        else if (r < 0.4) { status = "review"; progress = 80 + rand(t) * 15; }
        else if (r < 0.46) { status = "testing"; progress = 85 + rand(t) * 10; }
        else if (r < 0.52) { status = "blocked"; progress = 20 + rand(t) * 30; }
        else if (r < 0.58) { status = "waiting"; progress = 15 + rand(t) * 20; }
        else if (r < 0.64) { status = "delayed"; progress = 35 + rand(t) * 25; }
        else if (r < 0.7) { status = "needs_attention"; progress = 25 + rand(t) * 30; }
        else if (r < 0.78) { status = "planning"; progress = 5 + rand(t) * 10; }
        else if (r < 0.84) { status = "ready_for_release"; progress = 100; }
        else { status = "not_started"; progress = 0; }
      }
      const priority = tpl.priority as string;
      const severity = priority === "critical" ? "critical" : priority === "high" ? "major" : "normal";
      const risk = priority === "critical" ? "high" : priority === "high" ? "medium" : "low";
      const startOffset = Math.floor(rand(t * 7 + num) * 10);
      const taskStart = addDays(start, startOffset);
      const taskEnd = addDays(taskStart, 3 + Math.floor(rand(t + 1) * 6));
      const expected = addDays(taskStart, 5);
      const actual = (status === "completed" || status === "released" || status === "ready_for_release")
        ? addDays(taskStart, 3 + Math.floor(rand(t + 3) * 5))
        : "";

      const task = await db.task.create({
        data: {
          title: tpl.title + (t >= TASK_TEMPLATES.length ? ` (v${Math.floor(t / TASK_TEMPLATES.length) + 1})` : ""),
          description: `Implement ${tpl.title.toLowerCase()} for the ${tpl.epic} epic. Coordinate with the ${tpl.project} squad and update the PRD link once the spec is finalized.`,
          priority,
          severity,
          category: tpl.category,
          project: tpl.project,
          epic: tpl.epic,
          story: `${tpl.epic.split(" ")[0]}-${(t % 5) + 1}`,
          sprintId: sprintIds[num],
          ownerId: empIds[ownerIdx],
          startDate: iso(taskStart),
          endDate: iso(taskEnd),
          expectedCompletion: iso(expected),
          actualCompletion: actual ? iso(actual) : "",
          dependencies: JSON.stringify(t % 4 === 0 ? [`${tpl.epic.split(" ")[0]}-${(t % 3) + 1}`] : []),
          riskLevel: risk,
          businessImpact: priority === "critical" ? "high" : "medium",
          status,
          tags: JSON.stringify([tpl.category, tpl.project, tpl.epic.split(" ")[0]]),
          remarks: status === "blocked" ? "Needs unblock before EOD." : status === "delayed" ? "Slipped from last sprint." : "",
          links: JSON.stringify([
            { label: "GitHub", url: `https://github.com/orbit/${tpl.project.toLowerCase().replace(/\s/g, "-")}/issues/${1000 + taskCounter}`, type: "github" },
            { label: "Jira", url: `https://orbit.atlassian.net/browse/${tpl.epic.split(" ")[0].toUpperCase()}-${100 + taskCounter}`, type: "jira" },
            ...(tpl.category === "design" ? [{ label: "Figma", url: "https://figma.com/file/orbit", type: "figma" as const }] : []),
            { label: "PRD", url: "https://docs.example.com/prd", type: "prd" },
          ]),
          estimate: tpl.estimate,
          progress,
          order: t,
        },
      });
      allTaskIds.push(task.id);
    }
  }
  console.log(`Created ${allTaskIds.length} tasks`);

  // ---- Daily updates for current sprint (today is day 0) + last 3 working days of prev sprint ----
  const currentSprintId = sprintIds[currentNum];
  const prevSprintId = sprintIds[currentNum - 1];
  // generate updates for the last 4 working days spanning prev sprint end and current start
  const updates: { date: Date; sprintId: string }[] = [];
  let cursor = startOfDay(now);
  // collect last 5 days (including today)
  for (let i = 0; i < 8; i++) {
    const d = addDays(cursor, -i);
    if (isWeekend(d)) continue;
    const sprint = sprintNumber(sprintStartForDate(d));
    updates.push({ date: d, sprintId: sprintIds[sprint] || currentSprintId });
    if (updates.length >= 5) break;
  }
  let updCounter = 0;
  for (const u of updates) {
    // each active-ish employee writes an update, tied to one of their tasks
    for (let e = 0; e < empIds.length; e++) {
      // find a task owned by them in that sprint
      const tasks = await db.task.findMany({ where: { ownerId: empIds[e], sprintId: u.sprintId } });
      if (tasks.length === 0) continue;
      const task = tasks[updCounter % tasks.length];
      const r = rand(e * 31 + updCounter);
      const mood = pick(MOODS, e + updCounter);
      const hours = 5 + Math.floor(r * 4);
      const pct = Math.min(100, Math.round((task.progress + (r < 0.3 ? 10 : 0))));
      await db.dailyUpdate.create({
        data: {
          taskId: task.id,
          employeeId: empIds[e],
          sprintId: u.sprintId,
          date: iso(u.date),
          todayProgress: pick(PROGRESS_LINES, updCounter + e),
          yesterdayProgress: updCounter === 0 ? "Sprint planning & backlog grooming." : pick(PROGRESS_LINES, updCounter + e + 3),
          tomorrowPlan: pick(TOMORROW_LINES, updCounter + e),
          percentage: pct,
          hoursWorked: hours,
          blockers: pick(BLOCKER_LINES, updCounter + e),
          risks: r < 0.2 ? "Scope at risk if upstream API slips." : "",
          managerNotes: e % 3 === 0 ? "Solid pace; watch the blocker." : "",
          dependencies: task.dependencies,
          expectedFinish: iso(addDays(u.date, 2 + (e % 4))),
          confidence: pick(["high", "medium", "low"], e + updCounter),
          mood,
          accomplishments: pick(PROGRESS_LINES, updCounter + e + 1),
        },
      });
      updCounter++;
    }
  }
  console.log(`Created daily updates`);

  // ---- Notes ----
  const noteSnippets = [
    { content: "Aarav flagged the Redis cutover as the top risk for the sprint.", type: "risk" },
    { content: "Ananya's onboarding redesign got positive feedback in usability testing.", type: "achievement" },
    { content: "Blocked: staging environment migration delayed billing QA.", type: "blocker" },
    { content: "Velocity trending up 12% over the last three sprints.", type: "achievement" },
    { content: "Consider splitting the CRDT task into two for next sprint.", type: "general" },
    { content: "Mobile push notifications need APNs cert renewal before release.", type: "risk" },
    { content: "Priya proposed a dedicated billing staging environment.", type: "retro" },
  ];
  for (let i = 0; i < noteSnippets.length; i++) {
    const n = noteSnippets[i];
    await db.note.create({
      data: {
        content: n.content,
        type: n.type,
        sprintId: currentSprintId,
        employeeId: empIds[i % empIds.length],
        taskId: allTaskIds[i % allTaskIds.length],
      },
    });
  }
  console.log(`Created notes`);
  console.log("Seed complete ✓");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
